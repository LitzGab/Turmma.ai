import { ESCOLAS_POR_PAGINA, type ConsultaDoPainel, type EscolaDoPainel, type OrdemDoPainel } from '@educa/shared'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useLocation, useSearch } from 'wouter'
import { Botao } from '../../componentes/Botao'
import { EstadoCarregando, EstadoVazio } from '../../componentes/estado'
import { formatarNumero, formatarQuantidade } from '../../formatar'
import { buscaDaConsulta, consultaDasEscolas, lerConsultaDaTela } from '../api/painel'
import { INICIO_DA_OPERACAO } from '../caminhos'
import { CLASSES_DO_BOTAO_SECUNDARIO } from '../componentes/botao-secundario'
import { ErroDaOperacao } from '../componentes/CascaDaOperacao'
import { CLASSES_DO_TOM, TEXTO_DO_ESTADO, TOM_DO_ESTADO } from '../estados-da-escola'
import { TEXTO_DA_LISTA_VAZIA } from '../textos'
import { useTituloDaPagina } from '../titulo'
import { NovaEscola } from './NovaEscola'
import { NovaRede } from './NovaRede'


const ROTULO_DA_ORDEM: Readonly<Record<OrdemDoPainel, string>> = { nome: 'Nome', uso: 'Mais uso no mês' }

/** O diálogo aberto: um de cada vez, e só enquanto está aberto ele existe. */
type Dialogo = 'rede' | 'escola' | undefined

/** O estado da coordenação em texto, com a cor de reforço da família dele (regra 50, item 11). */
function Estado({ escola }: { escola: EscolaDoPainel }) {
  return <span className={`inline-block rounded-lg px-2 py-0.5 text-sm font-medium ${CLASSES_DO_TOM[TOM_DO_ESTADO[escola.estado]]}`}>{TEXTO_DO_ESTADO[escola.estado]}</span>
}

/** Computador: a tabela, com a escola como cabeçalho da linha. Abaixo de 640 px ela some e ficam os cartões. */
function Tabela({ escolas }: { escolas: readonly EscolaDoPainel[] }) {
  return (
    <table className="hidden w-full table-fixed border-collapse text-sm sm:table">
      <caption className="sr-only">Escolas, com a rede, o estado da coordenação e as contagens do ano letivo em curso</caption>
      <thead>
        <tr className="border-b border-linha text-left text-sutil">
          <th scope="col" className="w-[34%] py-2 pr-3 font-medium">
            Escola
          </th>
          <th scope="col" className="w-[20%] py-2 pr-3 font-medium">
            Rede
          </th>
          <th scope="col" className="w-[19%] py-2 pr-3 font-medium">
            Coordenação
          </th>
          <th scope="col" className="py-2 pr-3 text-right font-medium">
            Turmas
          </th>
          <th scope="col" className="py-2 pr-3 text-right font-medium">
            Professores
          </th>
          <th scope="col" className="py-2 text-right font-medium">
            Alunos
          </th>
        </tr>
      </thead>
      <tbody>
        {escolas.map((escola) => (
          <tr key={escola.id} className="border-b border-linha align-top">
            <th scope="row" className="py-3 pr-3 text-left font-normal">
              <span className="block font-medium wrap-anywhere text-tinta">{escola.nome}</span>
              <span className="block text-sutil wrap-anywhere">/e/{escola.slug}</span>
            </th>
            <td className="py-3 pr-3 wrap-anywhere">{escola.rede.nome}</td>
            <td className="py-3 pr-3">
              <Estado escola={escola} />
            </td>
            <td className="py-3 pr-3 text-right tabular-nums">{formatarNumero(escola.turmas)}</td>
            <td className="py-3 pr-3 text-right tabular-nums">{formatarNumero(escola.professores)}</td>
            <td className="py-3 text-right tabular-nums">{formatarNumero(escola.alunos)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

/** Celular: um cartão por escola, com as três contagens lado a lado, sem rolagem horizontal a 360 px. */
function Cartoes({ escolas }: { escolas: readonly EscolaDoPainel[] }) {
  return (
    <ul className="flex flex-col gap-3 sm:hidden">
      {escolas.map((escola) => (
        <li key={escola.id} className="rounded-cartao border border-linha bg-superficie p-4">
          <h2 className="font-semibold wrap-anywhere">{escola.nome}</h2>
          <p className="text-sm text-sutil wrap-anywhere">/e/{escola.slug}</p>
          <p className="mt-1 text-sm text-apoio wrap-anywhere">Rede: {escola.rede.nome}</p>
          <p className="mt-2">
            <Estado escola={escola} />
          </p>
          <dl className="mt-3 grid grid-cols-3 gap-2 text-sm">
            <div className="min-w-0">
              <dt className="text-sutil">Turmas</dt>
              <dd className="font-medium tabular-nums">{formatarNumero(escola.turmas)}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-sutil">Professores</dt>
              <dd className="font-medium tabular-nums">{formatarNumero(escola.professores)}</dd>
            </div>
            <div className="min-w-0">
              <dt className="text-sutil">Alunos</dt>
              <dd className="font-medium tabular-nums">{formatarNumero(escola.alunos)}</dd>
            </div>
          </dl>
        </li>
      ))}
    </ul>
  )
}

/**
 * Escolas (`/operacao`; Tech Spec da A0b, seção 9; RF3 e RF5): a lista de todas as escolas, com a rede, o estado da
 * primeira coordenação e as contagens do ano letivo em curso — **só número**, nunca pessoa (D10, D76). A página e a ordem
 * ficam na query string; a troca mantém a página anterior na tela até a nova chegar. Nova rede e Nova escola abrem em
 * diálogo, daqui.
 *
 * Os quatro estados (regra 50, item 5): carregando; erro, com "Tentar de novo" e a tela no lugar; vazio, que convida a
 * criar a rede; e com dado. A página além da última (endereço digitado, escola que saiu) tem o seu vazio, com o caminho
 * de volta à primeira.
 */
export function Escolas() {
  useTituloDaPagina('Escolas')
  const busca = useSearch()
  const [, navegar] = useLocation()
  const consulta = lerConsultaDaTela(busca)
  const escolas = useQuery(consultaDasEscolas(consulta))
  const [dialogo, definirDialogo] = useState<Dialogo>(undefined)
  const [anuncio, definirAnuncio] = useState('')
  // A rede criada por último nesta tela: o Nova escola já a traz escolhida (o fluxo rede → escola, cenário W8).
  const [redeSugerida, definirRedeSugerida] = useState<string | undefined>(undefined)

  function irPara(nova: ConsultaDoPainel): void {
    navegar(`${INICIO_DA_OPERACAO}?${buscaDaConsulta(nova)}`)
  }

  const dados = escolas.data
  const paginas = dados === undefined ? 1 : Math.max(1, Math.ceil(dados.total / ESCOLAS_POR_PAGINA))
  const trocando = escolas.isPlaceholderData

  return (
    <>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-3">
          <Botao onClick={() => definirDialogo('escola')}>Nova escola</Botao>
          <button type="button" onClick={() => definirDialogo('rede')} className={CLASSES_DO_BOTAO_SECUNDARIO}>
            Nova rede
          </button>
        </div>
        <div role="group" aria-label="Ordenar as escolas por" className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-sutil" aria-hidden="true">
            Ordenar por
          </span>
          {(['nome', 'uso'] as const).map((ordem) => (
            <button
              key={ordem}
              type="button"
              aria-pressed={consulta.ordem === ordem}
              onClick={() => irPara({ pagina: 1, ordem })}
              className={`inline-flex min-h-11 items-center justify-center rounded-full border px-4 py-2 text-sm font-medium ${
                consulta.ordem === ordem ? 'border-noite bg-noite text-white' : 'border-borda-campo bg-superficie text-tinta hover:bg-realce-suave'
              }`}
            >
              {ROTULO_DA_ORDEM[ordem]}
            </button>
          ))}
        </div>
      </div>

      <div role="status">{anuncio !== '' && <p className="rounded-controle border border-ok bg-ok-cx p-3 text-ok wrap-anywhere">{anuncio}</p>}</div>

      {escolas.isPending ? (
        <EstadoCarregando rotulo="Carregando as escolas…" />
      ) : escolas.isError && dados === undefined ? (
        <ErroDaOperacao erro={escolas.error} aoTentarDeNovo={() => void escolas.refetch()} tentando={escolas.isFetching} />
      ) : dados === undefined || dados.total === 0 ? (
        <EstadoVazio titulo={TEXTO_DA_LISTA_VAZIA.titulo} descricao={TEXTO_DA_LISTA_VAZIA.descricao} acao={{ rotulo: 'Nova rede', aoAcionar: () => definirDialogo('rede') }} />
      ) : dados.itens.length === 0 ? (
        <EstadoVazio
          titulo="Não há escolas nesta página."
          descricao={`A lista tem ${formatarQuantidade(paginas, 'página', 'páginas')}.`}
          acao={{ rotulo: 'Ir para a primeira página', aoAcionar: () => irPara({ pagina: 1, ordem: consulta.ordem }) }}
        />
      ) : (
        <section aria-label="Lista de escolas" aria-busy={trocando} className="flex flex-col gap-4">
          {escolas.isError && <ErroDaOperacao erro={escolas.error} aoTentarDeNovo={() => void escolas.refetch()} tentando={escolas.isFetching} />}
          <p className="text-sm text-sutil">{formatarQuantidade(dados.total, 'escola', 'escolas')}</p>
          <Tabela escolas={dados.itens} />
          <Cartoes escolas={dados.itens} />
          <nav aria-label="Páginas da lista" className="flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              disabled={consulta.pagina <= 1 || trocando}
              onClick={() => irPara({ pagina: consulta.pagina - 1, ordem: consulta.ordem })}
              className={`${CLASSES_DO_BOTAO_SECUNDARIO} disabled:border-inativo disabled:text-inativo`}
            >
              Anterior
            </button>
            <p className="text-sm text-apoio">
              Página {formatarNumero(consulta.pagina)} de {formatarNumero(paginas)}
              <span role="status" className="sr-only">
                {trocando ? 'Carregando a página…' : ''}
              </span>
            </p>
            <button
              type="button"
              disabled={consulta.pagina >= paginas || trocando}
              onClick={() => irPara({ pagina: consulta.pagina + 1, ordem: consulta.ordem })}
              className={`${CLASSES_DO_BOTAO_SECUNDARIO} disabled:border-inativo disabled:text-inativo`}
            >
              Próxima
            </button>
          </nav>
        </section>
      )}

      {dialogo === 'rede' && (
        <NovaRede
          aoFechar={() => definirDialogo(undefined)}
          aoCriar={(rede) => {
            definirAnuncio(`Rede ${rede.nome} criada. Agora crie a escola dela em Nova escola.`)
            // A resposta pode chegar depois de o diálogo fechar, com outro já aberto: só este fecha.
            definirDialogo((aberto) => (aberto === 'rede' ? undefined : aberto))
            definirRedeSugerida(rede.id)
          }}
        />
      )}
      {dialogo === 'escola' && (
        <NovaEscola
          redeSugeridaId={redeSugerida}
          aoFechar={() => definirDialogo(undefined)}
          aoPedirNovaRede={() => definirDialogo('rede')}
          aoCriar={(escola) => {
            definirAnuncio(`Escola ${escola.nome} criada.`)
            definirDialogo((aberto) => (aberto === 'escola' ? undefined : aberto))
          }}
        />
      )}
    </>
  )
}
