import { ESCOLAS_POR_PAGINA, type ConsultaDoPainel, type EscolaDoPainel, type OrdemDoPainel } from '@educa/shared'
import { useQuery } from '@tanstack/react-query'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useSearch } from 'wouter'
import { Botao } from '../../componentes/Botao'
import { EstadoCarregando, EstadoVazio } from '../../componentes/estado'
import { formatarNumero, formatarQuantidade } from '../../formatar'
import { acoesDoConvite, ROTULO_DA_ACAO, type AcaoDoConvite } from '../acoes-do-convite'
import { buscaDaConsulta, consultaDasEscolas, lerConsultaDaTela } from '../api/painel'
import { INICIO_DA_OPERACAO } from '../caminhos'
import { CLASSES_DO_BOTAO_SECUNDARIO } from '../componentes/botao-secundario'
import { ErroDaOperacao } from '../componentes/CascaDaOperacao'
import { ConfirmarConvite } from '../componentes/ConfirmarConvite'
import { GerarConvite, RefazerConvite } from '../componentes/DialogoDoConvite'
import { useDialogoDaTela } from '../dialogo-aberto'
import { CLASSES_DO_TOM, TEXTO_DO_ESTADO, TOM_DO_ESTADO } from '../estados-da-escola'
import { TEXTO_DA_LISTA_VAZIA } from '../textos'
import { useTituloDaPagina } from '../titulo'
import { NovaEscola } from './NovaEscola'
import { NovaRede } from './NovaRede'


const ROTULO_DA_ORDEM: Readonly<Record<OrdemDoPainel, string>> = { nome: 'Nome', uso: 'Mais uso no mês' }

/** O estado da coordenação em texto, com a cor de reforço da família dele (regra 50, item 11). */
function Estado({ escola }: { escola: EscolaDoPainel }) {
  return <span className={`inline-block rounded-lg px-2 py-0.5 text-sm font-medium ${CLASSES_DO_TOM[TOM_DO_ESTADO[escola.estado]]}`}>{TEXTO_DO_ESTADO[escola.estado]}</span>
}

/** O resto do nome acessível de cada ação, depois do rótulo visível: o botão diz de que escola é (WCAG 2.5.3). */
const COMPLEMENTO_DA_ACAO: Readonly<Record<AcaoDoConvite, string>> = {
  gerar: 'a coordenação de',
  refazer: 'o convite de',
  revogar: 'o convite de',
}

type AoAcionar = (acao: AcaoDoConvite, escola: EscolaDoPainel) => void

/** O que a linha precisa da tela: abrir o diálogo da ação, e pôr o foco num lugar estável da escola quando o perde. */
interface AcoesDaLinha {
  readonly aoAcionar: AoAcionar
  readonly focarNaEscola: (escolaId: string) => void
}

/** O atributo que marca as ações de cada escola na tabela e no cartão: é por ele que o foco acha a linha de novo. */
const ATRIBUTO_DAS_ACOES = 'data-acoes-da-escola'

/**
 * As ações do convite da coordenação na linha e no cartão da escola, pela matriz (`acoes-do-convite.ts`): só o que o
 * estado que a API deu permite. A chave é a **posição**: quando a lista recarrega com o estado novo ("Convidar" vira
 * "Refazer"), o botão continua o mesmo elemento, e o foco que o diálogo devolve a ele ao fechar não se perde.
 *
 * Quando o botão com o foco sai da linha (o "Revogar" depois do revogar: `revogado` só tem "Convidar"), o foco vai para
 * a primeira ação que sobrou na escola, ou para o anúncio da tela (`focarNaEscola`), e não para o `body`.
 */
function AcoesDoConvite({ escola, aoAcionar, focarNaEscola }: { escola: EscolaDoPainel } & AcoesDaLinha) {
  const acoes = acoesDoConvite(escola)
  // O botão que tinha o foco quando o `ref` dele foi desligado. O `ref` em linha é desligado a cada renderização, e não
  // só quando o botão sai; por isso, depois do commit, só conta se ele de fato saiu da página e o foco ficou no `body`.
  const comOFoco = useRef<HTMLButtonElement | undefined>(undefined)
  useEffect(() => {
    const botao = comOFoco.current
    comOFoco.current = undefined
    if (botao === undefined || botao.isConnected || document.activeElement !== document.body) return
    focarNaEscola(escola.id)
  })
  return (
    <div {...{ [ATRIBUTO_DAS_ACOES]: escola.id }} className={acoes.length === 0 ? 'hidden' : 'mt-2 flex flex-wrap gap-2'}>
      {acoes.map((acao, posicao) => (
        <button
          key={posicao}
          ref={(botao) => () => {
            if (botao !== null && botao === document.activeElement) comOFoco.current = botao
          }}
          type="button"
          onClick={() => aoAcionar(acao, escola)}
          className={CLASSES_DO_BOTAO_SECUNDARIO}
        >
          {ROTULO_DA_ACAO[acao]}
          <span className="sr-only">
            {' '}
            {COMPLEMENTO_DA_ACAO[acao]} {escola.nome}
          </span>
        </button>
      ))}
    </div>
  )
}

/** Computador: a tabela, com a escola como cabeçalho da linha. Abaixo de 640 px ela some e ficam os cartões. */
function Tabela({ escolas, ...linha }: { escolas: readonly EscolaDoPainel[] } & AcoesDaLinha) {
  return (
    <table className="hidden w-full table-fixed border-collapse text-sm sm:table">
      <caption className="sr-only">Escolas, com a rede, o estado da coordenação e as contagens do ano letivo em curso</caption>
      <thead>
        <tr className="border-b border-linha text-left text-sutil">
          <th scope="col" className="w-[30%] py-2 pr-3 font-medium">
            Escola
          </th>
          <th scope="col" className="w-[18%] py-2 pr-3 font-medium">
            Rede
          </th>
          <th scope="col" className="w-[25%] py-2 pr-3 font-medium">
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
              <AcoesDoConvite escola={escola} {...linha} />
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
function Cartoes({ escolas, ...linha }: { escolas: readonly EscolaDoPainel[] } & AcoesDaLinha) {
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
          <AcoesDoConvite escola={escola} {...linha} />
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
 * diálogo, daqui, e também o convite da coordenação de cada escola: convidar, refazer e revogar, pela matriz do estado
 * (tarefa 7.0).
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
  // O diálogo aberto: um de cada vez, e só enquanto está aberto ele existe; cada abertura é uma instância própria. Os do
  // convite levam a escola da linha, fotografada na abertura.
  const dialogo = useDialogoDaTela<'rede' | 'escola' | AcaoDoConvite, EscolaDoPainel>()
  const aberta = dialogo.aberta
  const alvo = aberta?.alvo
  const [anuncio, definirAnuncio] = useState('')
  // A rede criada por último nesta tela: o Nova escola já a traz escolhida (o fluxo rede → escola, cenário W8).
  const [redeSugerida, definirRedeSugerida] = useState<string | undefined>(undefined)
  const regiaoDoAnuncio = useRef<HTMLDivElement>(null)

  /**
   * O foco num lugar estável da escola, quando o botão que o tinha saiu da linha: a primeira ação que sobrou nela, na
   * tabela ou no cartão (o que está à vista); sem ação nenhuma, o anúncio da tela.
   */
  const focarNaEscola = useCallback((escolaId: string) => {
    const grupos = Array.from(document.querySelectorAll<HTMLElement>(`[${ATRIBUTO_DAS_ACOES}="${CSS.escape(escolaId)}"]`))
    const botao = grupos.find((grupo) => grupo.getClientRects().length > 0)?.querySelector('button')
    if (botao) botao.focus()
    else regiaoDoAnuncio.current?.focus()
  }, [])

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
          <Botao onClick={() => dialogo.abrir('escola')}>Nova escola</Botao>
          <button type="button" onClick={() => dialogo.abrir('rede')} className={CLASSES_DO_BOTAO_SECUNDARIO}>
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

      <div ref={regiaoDoAnuncio} tabIndex={-1} role="status">{anuncio !== '' && <p className="rounded-controle border border-ok bg-ok-cx p-3 text-ok wrap-anywhere">{anuncio}</p>}</div>

      {escolas.isPending ? (
        <EstadoCarregando rotulo="Carregando as escolas…" />
      ) : escolas.isError && dados === undefined ? (
        <ErroDaOperacao erro={escolas.error} aoTentarDeNovo={() => void escolas.refetch()} tentando={escolas.isFetching} />
      ) : dados === undefined || dados.total === 0 ? (
        <EstadoVazio titulo={TEXTO_DA_LISTA_VAZIA.titulo} descricao={TEXTO_DA_LISTA_VAZIA.descricao} acao={{ rotulo: 'Nova rede', aoAcionar: () => dialogo.abrir('rede') }} />
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
          <Tabela escolas={dados.itens} aoAcionar={dialogo.abrir} focarNaEscola={focarNaEscola} />
          <Cartoes escolas={dados.itens} aoAcionar={dialogo.abrir} focarNaEscola={focarNaEscola} />
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

      {aberta?.tipo === 'rede' && (
        <NovaRede
          key={aberta.numero}
          aoFechar={dialogo.fechar}
          aoCriar={(rede) => {
            definirAnuncio(`Rede ${rede.nome} criada. Agora crie a escola dela em Nova escola.`)
            // A resposta pode chegar depois de o diálogo fechar, com outro já aberto, até outro Nova rede: só esta
            // abertura fecha (`dialogo-aberto.ts`).
            dialogo.fecharSeAinda(aberta)
            definirRedeSugerida(rede.id)
          }}
        />
      )}
      {aberta?.tipo === 'escola' && (
        <NovaEscola
          key={aberta.numero}
          redeSugeridaId={redeSugerida}
          aoFechar={dialogo.fechar}
          aoPedirNovaRede={() => dialogo.abrir('rede')}
          aoCriar={(escola) => {
            definirAnuncio(`Escola ${escola.nome} criada.`)
            dialogo.fecharSeAinda(aberta)
          }}
        />
      )}
      {/* O gerar e o refazer não fecham sozinhos: a resposta deles só preenche o diálogo que a pediu (`DialogoDoConvite.tsx`). */}
      {aberta?.tipo === 'gerar' && alvo !== undefined && <GerarConvite key={aberta.numero} escola={alvo} aoFechar={dialogo.fechar} focoDeReserva={() => focarNaEscola(alvo.id)} />}
      {aberta?.tipo === 'refazer' && alvo?.conviteId !== undefined && (
        <RefazerConvite key={aberta.numero} escola={alvo} conviteId={alvo.conviteId} aoFechar={dialogo.fechar} focoDeReserva={() => focarNaEscola(alvo.id)} />
      )}
      {aberta?.tipo === 'revogar' && alvo?.conviteId !== undefined && (
        <ConfirmarConvite
          key={aberta.numero}
          escola={alvo}
          conviteId={alvo.conviteId}
          aoFechar={dialogo.fechar}
          focoDeReserva={() => focarNaEscola(alvo.id)}
          aoRevogar={() => {
            definirAnuncio(`Convite de ${alvo.nome} revogado.`)
            dialogo.fecharSeAinda(aberta)
          }}
        />
      )}
    </>
  )
}
