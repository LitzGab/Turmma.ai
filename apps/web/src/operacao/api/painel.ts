import {
  esquemaRespostaCriadoNoPainel,
  esquemaRespostaEscolasDoPainel,
  esquemaRespostaRedesDoPainel,
  MAXIMA_PAGINA_DO_PAINEL,
  ORDENS_DO_PAINEL,
  type ConsultaDoPainel,
  type OrdemDoPainel,
  type PedidoCriarEscola,
  type PedidoCriarRede,
  type RespostaCriadoNoPainel,
} from '@educa/shared'
import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { chamarComSessaoDeOperador } from './sessao'

/**
 * O painel da operação na web (Tech Spec da A0b, seções 4 e 9): a lista de escolas, as redes do diálogo Nova escola e as
 * duas criações. Tudo pela sessão do operador, com os contratos de `packages/shared` (regra 00, item 6). As chaves começam
 * por `operacao`, no cache próprio da área, que se esvazia inteiro quando a sessão acaba ou muda de dono.
 */

export const CAMINHO_DAS_REDES = '/v1/operacao/redes'
export const CAMINHO_DAS_ESCOLAS = '/v1/operacao/escolas'

/** A consulta padrão da lista: a primeira página, por nome. */
export const CONSULTA_PADRAO: ConsultaDoPainel = { pagina: 1, ordem: 'nome' }

const ehOrdem = (valor: string | null): valor is OrdemDoPainel => (ORDENS_DO_PAINEL as readonly (string | null)[]).includes(valor)

/**
 * `pagina` e `ordem` da barra de endereço (Tech Spec da A0b, seção 9: a página e a ordem ficam na query string, e o
 * endereço copiado abre a mesma lista). O endereço é digitável: o que não é uma página ou uma ordem do contrato volta ao
 * padrão daquele campo, sem erro na tela, e a API nunca recebe o que o contrato estrito dela recusaria.
 */
export function lerConsultaDaTela(busca: string): ConsultaDoPainel {
  const parametros = new URLSearchParams(busca)
  const pagina = parametros.get('pagina')
  const ordem = parametros.get('ordem')
  const numero = pagina !== null && /^[1-9]\d{0,4}$/.test(pagina) ? Number(pagina) : CONSULTA_PADRAO.pagina
  return {
    pagina: numero <= MAXIMA_PAGINA_DO_PAINEL ? numero : CONSULTA_PADRAO.pagina,
    ordem: ehOrdem(ordem) ? ordem : CONSULTA_PADRAO.ordem,
  }
}

/** A query string da consulta, na ordem fixa `pagina` e `ordem`: é a da barra e a do `GET`. */
export function buscaDaConsulta(consulta: ConsultaDoPainel): string {
  return new URLSearchParams({ pagina: String(consulta.pagina), ordem: consulta.ordem }).toString()
}

/**
 * `GET /v1/operacao/escolas`: a página, com o total. Na troca de página ou de ordem, a anterior fica na tela até a nova
 * chegar (`placeholderData`), em vez de a lista sumir e voltar a cada clique no Chromebook em rede lenta.
 */
export function consultaDasEscolas(consulta: ConsultaDoPainel) {
  return queryOptions({
    queryKey: ['operacao', 'escolas', consulta.ordem, consulta.pagina],
    queryFn: ({ signal }) => chamarComSessaoDeOperador(`${CAMINHO_DAS_ESCOLAS}?${buscaDaConsulta(consulta)}`, esquemaRespostaEscolasDoPainel, { sinal: signal }),
    placeholderData: keepPreviousData,
  })
}

/** `GET /v1/operacao/redes`: as redes do diálogo Nova escola, por nome. */
export const consultaDasRedes = queryOptions({
  queryKey: ['operacao', 'redes'],
  queryFn: ({ signal }) => chamarComSessaoDeOperador(CAMINHO_DAS_REDES, esquemaRespostaRedesDoPainel, { sinal: signal }),
})

/** O prefixo das chaves que a criação de rede ou de escola deixa velhas. */
export const CHAVE_DAS_ESCOLAS = ['operacao', 'escolas'] as const
export const CHAVE_DAS_REDES = consultaDasRedes.queryKey

/** `POST /v1/operacao/redes`, com o id sorteado ao abrir o diálogo. O pedido repetido devolve o mesmo id. */
export function criarRedeNoPainel(pedido: PedidoCriarRede): Promise<RespostaCriadoNoPainel> {
  return chamarComSessaoDeOperador(CAMINHO_DAS_REDES, esquemaRespostaCriadoNoPainel, { metodo: 'POST', corpo: pedido })
}

/** `POST /v1/operacao/escolas`, como o da rede. O endereço que já é de outra escola volta `CONFLITO`. */
export function criarEscolaNoPainel(pedido: PedidoCriarEscola): Promise<RespostaCriadoNoPainel> {
  return chamarComSessaoDeOperador(CAMINHO_DAS_ESCOLAS, esquemaRespostaCriadoNoPainel, { metodo: 'POST', corpo: pedido })
}
