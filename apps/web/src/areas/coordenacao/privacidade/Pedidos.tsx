import type { ItemDoPedido } from '@educa/shared'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import { Link } from 'wouter'
import { consultaPedidosDoTitular } from '../../../api/privacidade'
import { Botao } from '../../../componentes/Botao'
import { CLASSES_DO_LINK_SECUNDARIO } from '../../../componentes/botao-secundario'
import { Anuncio } from '../../../componentes/dialogos'
import { EstadoCarregando, EstadoErro, EstadoVazio } from '../../../componentes/estado'
import { Faixa } from '../../../componentes/Faixa'
import { Estado } from '../../../componentes/SeloDeEstado'
import { Tabela, type ColunaDaTabela } from '../../../componentes/Tabela'
import { CabecalhoDeSecao } from '../../../componentes/Tela'
import { mensagemDoErro } from '../../../api/cliente'
import { ROTAS_DA_COORDENACAO } from '../../../caminhos'
import { formatarData } from '../../../formatar'
import { RegistrarPedido } from './RegistrarPedido'
import {
  AVISO_DO_ALUNO_DA_LISTA,
  ordenarOsPedidos,
  ROTULO_DE_QUEM_PEDIU,
  ROTULO_DO_TIPO,
  SITUACAO_DO_PEDIDO,
  TEXTO_DO_TITULAR_ELIMINADO,
  textoDasTurmas,
} from './textos-dos-pedidos'

/** Na turma da lista, o titular eliminado não tem turma para mostrar: o nome e a turma saíram do sistema com ele (RF14). */
const TEXTO_SEM_TURMA_DO_ELIMINADO = 'Não consta'

const COLUNAS_DOS_PEDIDOS: readonly [ColunaDaTabela<ItemDoPedido>, ...ColunaDaTabela<ItemDoPedido>[]] = [
  { chave: 'pessoa', titulo: 'Pessoa', celula: (pedido) => pedido.titular?.nome ?? TEXTO_DO_TITULAR_ELIMINADO },
  { chave: 'turma', titulo: 'Turma', celula: (pedido) => (pedido.titular === null ? TEXTO_SEM_TURMA_DO_ELIMINADO : textoDasTurmas(pedido.titular.turmas)) },
  { chave: 'tipo', titulo: 'Pedido', celula: (pedido) => ROTULO_DO_TIPO[pedido.tipo] },
  { chave: 'solicitante', titulo: 'Quem pediu', celula: (pedido) => ROTULO_DE_QUEM_PEDIU[pedido.solicitante] },
  { chave: 'chegouEm', titulo: 'Chegou em', celula: (pedido) => formatarData(pedido.chegouEm) },
  {
    chave: 'situacao',
    titulo: 'Situação',
    celula: (pedido) => {
      const situacao = SITUACAO_DO_PEDIDO[pedido.estado]
      return <Estado familia={situacao.familia}>{situacao.texto}</Estado>
    },
  },
]

/**
 * A aba "Pedidos" (F3, 16.0; RF10, RF14 e RF16): os pedidos dos titulares desta escola, o mais recente primeiro, e o
 * "Registrar pedido" que abre a busca e a confirmação. O detalhe de cada pedido é da 17.0.
 *
 * - **Sempre relê ao abrir**: a lista não fica guardada fora da tela (`gcTime: 0`, em `api/privacidade.ts`), então cada
 *   abertura é uma leitura nova. Outra pessoa da coordenação pode ter registrado, e a eliminação muda de estado sozinha (o
 *   prazo de 7 dias passa na fila, não na tela). Nenhuma leitura sai sozinha depois: nem pelo foco, nem pela rede.
 * - **Os quatro estados**: carregando, erro com "Tentar de novo", vazio (um convite: nenhum pedido ainda) e o dado.
 * - **Páginas de 50**: "Ver mais pedidos" lê a seguinte; a ordem vale entre as páginas já lidas, porque a API pagina por id.
 * - **Aviso fixo** do aluno da lista: ele não tem conta e não aparece na busca, e o caminho dele é a lista da turma.
 */
export function Pedidos() {
  const consulta = useInfiniteQuery(consultaPedidosDoTitular)
  const [anuncio, definirAnuncio] = useState('')
  const pedidos = useMemo(() => ordenarOsPedidos((consulta.data?.pages ?? []).flatMap((pagina) => pagina.itens)), [consulta.data])

  if (consulta.isPending) return <EstadoCarregando rotulo="Carregando os pedidos…" />
  // Sem página nenhuma e fora do carregamento, só resta a falha. A falha de "Ver mais" fica abaixo da lista, com o que já foi lido.
  if (consulta.data === undefined) {
    return <EstadoErro erro={consulta.error} tentando={consulta.isFetching} aoTentarDeNovo={() => void consulta.refetch({ cancelRefetch: false })} />
  }

  return (
    <section className="flex min-w-0 flex-col gap-3" aria-labelledby="titulo-dos-pedidos">
      <CabecalhoDeSecao
        id="titulo-dos-pedidos"
        titulo="Pedidos dos titulares"
        apoio="Acesso, portabilidade, compartilhamento, correção e eliminação de dados, pedidos pela própria pessoa ou pelo responsável."
        acao={<RegistrarPedido aoRegistrado={definirAnuncio} />}
      />
      <Anuncio texto={anuncio} />
      <Faixa>{AVISO_DO_ALUNO_DA_LISTA}</Faixa>
      <div>
        <Link to={ROTAS_DA_COORDENACAO.estrutura} className={CLASSES_DO_LINK_SECUNDARIO}>
          Ir para a Estrutura
        </Link>
      </div>
      {pedidos.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum pedido registrado"
          descricao="Quando uma pessoa ou o responsável pedir acesso, correção ou eliminação dos dados, registre aqui: a Turmma monta o arquivo, guarda a lista de quem recebeu dado e agenda a eliminação."
        />
      ) : (
        <Tabela rotulo="Pedidos dos titulares" colunas={COLUNAS_DOS_PEDIDOS} linhas={pedidos} chaveDaLinha={(pedido) => pedido.id} />
      )}
      {consulta.isFetchNextPageError && (
        <p role="alert" className="rounded-controle border border-erro bg-erro-cx p-3 break-words text-erro">
          {mensagemDoErro(consulta.error)}
        </p>
      )}
      {consulta.hasNextPage && (
        <div className="flex flex-wrap items-center gap-3">
          <Botao variante="secundario" disabled={consulta.isFetchingNextPage} onClick={() => void consulta.fetchNextPage()}>
            {consulta.isFetchingNextPage ? 'Carregando…' : 'Ver mais pedidos'}
          </Botao>
        </div>
      )}
    </section>
  )
}
