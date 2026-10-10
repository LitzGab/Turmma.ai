import { CodigoDeErro, type LinhaDoCompartilhamento, type PedidoDoTitular } from '@educa/shared'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link } from 'wouter'
import { ErroDaApi } from '../../../api/cliente'
import { consultaPedidoDoTitular, consultaSuboperadores, relerPedidoDoTitular } from '../../../api/privacidade'
import { caminhoDaAbaDaPrivacidade, ROTAS_DA_COORDENACAO } from '../../../caminhos'
import { Botao } from '../../../componentes/Botao'
import { CLASSES_DO_LINK_SECUNDARIO } from '../../../componentes/botao-secundario'
import { Cartao } from '../../../componentes/Cartao'
import { Anuncio } from '../../../componentes/dialogos'
import { EstadoCarregando, EstadoErro } from '../../../componentes/estado'
import { Estado } from '../../../componentes/SeloDeEstado'
import { Tabela, type ColunaDaTabela } from '../../../componentes/Tabela'
import { Tela } from '../../../componentes/Tela'
import { formatarData, formatarDataHora } from '../../../formatar'
import { useTituloDaTela } from '../../../titulo'
import { AcoesDoPedido } from './AcoesDoPedido'
import { agendarPreparacao } from './preparacao-do-arquivo'
import { ROTULO_DE_QUEM_PEDIU, ROTULO_DO_TIPO, SITUACAO_DO_PEDIDO, TEXTO_DO_TITULAR_ELIMINADO, hojeEmSaoPaulo, textoDasTurmas } from './textos-dos-pedidos'
import {
  acoesDoPedido,
  ANUNCIO_DO_ARQUIVO_PRONTO,
  AVISO_DE_AVISAR_AS_EMPRESAS,
  nomeDaEmpresa,
  orientacaoDoPedido,
  ordenarOCompartilhamento,
  periodoDaLinha,
  PRAZO_DA_DECLARACAO_COMPLETA_DIAS,
  prazoDoPedido,
  ROTULO_DA_ORIGEM,
  TEXTO_DO_PEDIDO_AUSENTE,
  textoDaTrocaDeNome,
  textoDoPrazo,
} from './textos-do-pedido'

const TEXTO_SEM_EMPRESAS = 'Nenhuma empresa recebeu dado desta pessoa no período em que a escola guarda o rastro das chamadas, e nenhuma atendia a escola enquanto ela estava aqui.'

/** O pedido de um titular que ainda não foi eliminado diz a turma; o eliminado, "Não consta": nome e turma saíram do sistema com ele. */
function textoDaPessoa(pedido: PedidoDoTitular): string {
  if (pedido.titular === null) return TEXTO_DO_TITULAR_ELIMINADO
  return `${pedido.titular.nome} · ${textoDasTurmas(pedido.titular.turmas)}`
}

function Linha({ rotulo, children }: { readonly rotulo: string; readonly children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
      <dt className="text-sm text-sutil">{rotulo}</dt>
      <dd className="min-w-0 font-medium break-words text-tinta">{children}</dd>
    </div>
  )
}

/**
 * O detalhe de um pedido de titular (F3, 17.0; RF12, RF13, RF13b, RF14, RF16): quem, o quê, quem pediu, a situação, o prazo
 * da declaração completa, as empresas por onde passou dado da pessoa e o que a coordenação pode fazer agora (concluir,
 * cancelar a eliminação, corrigir o nome e baixar a versão da escola).
 *
 * - **Cada leitura é auditada** (`pedido.lido`, regra 20, item 10): a página lê ao abrir e depois de cada ação, e nunca ao
 *   voltar o foco nem quando a rede volta. A única leitura sozinha é a do arquivo em preparação, a cada 10 s e só com a
 *   aba à vista (`preparacao-do-arquivo.ts`); "Atualizar" lê quando a pessoa pede.
 * - **O pedido não fica na memória** depois de a tela sair (`gcTime: 0`): nome e turma de titular não ficam num computador
 *   compartilhado da secretaria. O nome nunca vai ao endereço nem ao título da aba.
 * - **Os quatro estados**: carregando, erro com "Tentar de novo", pedido que não se acha (outra escola e inexistente
 *   respondem igual, regra 10, item 6) e o dado.
 */
export default function DetalheDoPedido({ pedidoId }: { readonly pedidoId: string }) {
  useTituloDaTela('Pedido de titular')
  const cliente = useQueryClient()
  const consulta = useQuery(consultaPedidoDoTitular(pedidoId))
  const pedido = consulta.data
  const estado = pedido?.estado
  const [anuncio, definirAnuncio] = useState('')
  const inicio = useRef<HTMLDivElement>(null)

  const ler = useCallback(() => {
    void relerPedidoDoTitular(cliente, pedidoId)
  }, [cliente, pedidoId])

  // O arquivo em montagem aparece pronto sem recarregar; parado o relógio, ele não volta sozinho com a aba escondida.
  useEffect(() => {
    if (estado === undefined) return undefined
    return agendarPreparacao(estado, ler, document)
  }, [estado, ler])

  const anterior = useRef(estado)
  useEffect(() => {
    if (anterior.current === 'em_preparacao' && estado === 'pronto') definirAnuncio(ANUNCIO_DO_ARQUIVO_PRONTO)
    anterior.current = estado
  }, [estado])

  const temEmpresas = (pedido?.compartilhamento.length ?? 0) > 0
  const suboperadores = useQuery({
    ...consultaSuboperadores,
    enabled: temEmpresas,
  })
  const linhas = useMemo(() => ordenarOCompartilhamento(pedido?.compartilhamento ?? []), [pedido?.compartilhamento])
  const colunas: readonly [ColunaDaTabela<LinhaDoCompartilhamento>, ...ColunaDaTabela<LinhaDoCompartilhamento>[]] = useMemo(
    () => [
      {
        chave: 'empresa',
        titulo: 'Empresa',
        celula: (linha) => nomeDaEmpresa(linha, suboperadores.data?.suboperadores),
      },
      {
        chave: 'periodo',
        titulo: 'Período',
        celula: (linha) => periodoDaLinha(linha),
      },
      {
        chave: 'origem',
        titulo: 'Como sabemos',
        celula: (linha) => ROTULO_DA_ORIGEM[linha.origem],
      },
    ],
    [suboperadores.data],
  )

  const voltar = (
    // Relativo à área: o `Route` aninhado em `/coordenacao` resolve o `to` a partir da base dela.
    <Link to={caminhoDaAbaDaPrivacidade('pedidos')} className="inline-flex min-h-11 items-center gap-2 self-start text-caramelo-texto underline">
      <ArrowLeft aria-hidden="true" size={18} />
      Voltar para os pedidos
    </Link>
  )

  if (consulta.isPending) {
    return (
      <Tela titulo="Pedido de titular" antes={voltar}>
        <EstadoCarregando rotulo="Carregando o pedido…" />
      </Tela>
    )
  }
  if (pedido === undefined) {
    const naoAchado = consulta.error instanceof ErroDaApi && consulta.error.codigo === CodigoDeErro.NAO_ENCONTRADO
    return (
      <Tela titulo="Pedido de titular" antes={voltar}>
        {naoAchado ? (
          <p role="status" className="rounded-cartao border border-linha bg-superficie p-4 text-apoio">
            {TEXTO_DO_PEDIDO_AUSENTE}
          </p>
        ) : (
          <EstadoErro erro={consulta.error} tentando={consulta.isFetching} aoTentarDeNovo={() => void consulta.refetch({ cancelRefetch: false })} />
        )}
      </Tela>
    )
  }

  const situacao = SITUACAO_DO_PEDIDO[pedido.estado]
  const prazo = textoDoPrazo(prazoDoPedido(pedido, hojeEmSaoPaulo()))
  const orientacao = orientacaoDoPedido(pedido)
  const troca = textoDaTrocaDeNome(pedido)

  return (
    <Tela
      titulo={pedido.titular?.nome ?? TEXTO_DO_TITULAR_ELIMINADO}
      objeto
      descricao={ROTULO_DO_TIPO[pedido.tipo]}
      antes={voltar}
      acoes={
        <Botao variante="secundario" onClick={ler} disabled={consulta.isFetching}>
          {consulta.isFetching ? 'Atualizando…' : 'Atualizar'}
        </Botao>
      }
    >
      <div ref={inicio} tabIndex={-1} className="flex min-w-0 flex-col gap-4 outline-none">
        <Cartao titulo="O pedido">
          <div className="flex min-w-0 flex-col gap-3">
            <dl className="flex min-w-0 flex-col gap-1.5 rounded-controle border border-linha p-3">
              <Linha rotulo="Pessoa">{textoDaPessoa(pedido)}</Linha>
              <Linha rotulo="Pedido">{ROTULO_DO_TIPO[pedido.tipo]}</Linha>
              <Linha rotulo="Quem pediu">{ROTULO_DE_QUEM_PEDIU[pedido.solicitante]}</Linha>
              <Linha rotulo="Chegou à escola em">{formatarData(pedido.chegouEm)}</Linha>
              <Linha rotulo="Situação">
                <Estado familia={situacao.familia}>{situacao.texto}</Estado>
              </Linha>
              {pedido.concluidoEm !== null && <Linha rotulo="Concluído em">{formatarDataHora(pedido.concluidoEm)}</Linha>}
            </dl>
            {orientacao !== undefined && <p className="break-words text-apoio">{orientacao}</p>}
            {/* A correção de turma ou de vínculo não é deste pedido: o caminho é a turma, na Estrutura (A1). */}
            {acoesDoPedido(pedido).corrigirNome && (
              <div>
                <Link to={ROTAS_DA_COORDENACAO.estrutura} className={CLASSES_DO_LINK_SECUNDARIO}>
                  Ir para a Estrutura
                </Link>
              </div>
            )}
            {troca !== undefined && <p className="rounded-controle border border-linha bg-info-cx p-3 break-words text-info">{troca}</p>}
            <Anuncio texto={anuncio} />
            <AcoesDoPedido pedido={pedido} aoAnunciar={definirAnuncio} focoDeReserva={() => inicio.current?.focus()} />
          </div>
        </Cartao>
        <Cartao titulo="Prazo da declaração completa">
          <div className="flex min-w-0 flex-col gap-2">
            <div>
              <Estado familia={prazo.familia}>{prazo.texto}</Estado>
            </div>
            <p className="text-sm break-words text-sutil">
              O prazo é de {String(PRAZO_DA_DECLARACAO_COMPLETA_DIAS)} dias e conta do dia em que o pedido chegou à escola (LGPD, art. 19, II).
            </p>
          </div>
        </Cartao>
        <Cartao titulo="Empresas que receberam dado desta pessoa">
          <div className="flex min-w-0 flex-col gap-3">
            {linhas.length === 0 ? (
              <p className="break-words text-apoio">{TEXTO_SEM_EMPRESAS}</p>
            ) : (
              <>
                <Tabela rotulo="Empresas que receberam dado desta pessoa" colunas={colunas} linhas={linhas} chaveDaLinha={(linha) => `${linha.chave}-${linha.primeiroEm}`} />
                <p className="text-sm break-words text-sutil">{AVISO_DE_AVISAR_AS_EMPRESAS}</p>
              </>
            )}
          </div>
        </Cartao>
      </div>
    </Tela>
  )
}
