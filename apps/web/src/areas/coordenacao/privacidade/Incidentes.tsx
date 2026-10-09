import type { IncidenteDaEscola } from '@educa/shared'
import { useQuery } from '@tanstack/react-query'
import { useRef } from 'react'
import { consultaIncidentes } from '../../../api/privacidade'
import { Botao } from '../../../componentes/Botao'
import { EstadoCarregando, EstadoErro, EstadoVazio } from '../../../componentes/estado'
import { Faixa } from '../../../componentes/Faixa'
import { Estado } from '../../../componentes/SeloDeEstado'
import { CabecalhoDeSecao } from '../../../componentes/Tela'
import { useConfirmarIncidente } from './confirmar-o-incidente'
import { DetalhesDoIncidente } from './DetalhesDoIncidente'
import { TEXTO_DO_QUE_CONFIRMAR_FAZ, textoDaConfirmacao, textoDoConhecimento } from './textos-dos-incidentes'

interface PropsDoCartao {
  readonly incidente: IncidenteDaEscola
  /** O id do aviso que está sendo confirmado agora. Com um no ar, todos os botões esperam: o clique duplo não manda dois pedidos. */
  readonly confirmando: string | undefined
  /** A falha do último pedido e de qual aviso ela é: só o cartão dele a mostra. */
  readonly falha: { readonly id: string; readonly texto: string } | undefined
  readonly aoConfirmar: (id: string) => Promise<boolean>
}

/** Um incidente da escola: o estado, todos os campos e, se espera a confirmação, o botão que a dá. */
function CartaoDoIncidente({ incidente, confirmando, falha, aoConfirmar }: PropsDoCartao) {
  const titulo = useRef<HTMLHeadingElement>(null)
  const pendente = incidente.confirmadoEm === null
  const esteConfirmando = confirmando === incidente.id
  return (
    <article className="flex min-w-0 flex-col gap-4 rounded-cartao border border-linha bg-superficie p-4" aria-labelledby={`incidente-${incidente.id}`}>
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <h3 id={`incidente-${incidente.id}`} ref={titulo} tabIndex={-1} className="text-base leading-snug font-semibold break-words text-tinta">
          Incidente conhecido em {textoDoConhecimento(incidente)}
        </h3>
        <Estado familia={pendente ? 'pendente' : 'ok'}>{textoDaConfirmacao(incidente)}</Estado>
      </div>
      <DetalhesDoIncidente incidente={incidente} />
      {pendente && (
        <div className="flex min-w-0 flex-col gap-3">
          <p className="text-apoio">{TEXTO_DO_QUE_CONFIRMAR_FAZ}</p>
          <p role="alert" className="rounded-controle bg-erro-cx p-3 break-words text-erro empty:hidden">
            {falha?.id === incidente.id ? falha.texto : ''}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Botao
              variante="oficial"
              disabled={confirmando !== undefined}
              onClick={() =>
                void aoConfirmar(incidente.id).then((confirmou) => {
                  // O cartão continua na tela, mudado de "esperando" para "confirmado": o foco vai para o título dele, e não se perde com o botão que saiu.
                  if (confirmou) titulo.current?.focus()
                })
              }
            >
              {esteConfirmando ? 'Confirmando…' : 'Confirmo que recebi'}
            </Botao>
            <span role="status" className="sr-only">
              {esteConfirmando ? 'Confirmando…' : ''}
            </span>
          </div>
        </div>
      )}
    </article>
  )
}

/**
 * A aba "Incidentes" (F3, 10.0; RF9 e RF20): os incidentes de segurança que afetaram a escola, só a seção dela, os que esperam
 * a confirmação primeiro, cada um com todos os campos e o prazo legal da escola em texto fixo. A coordenação que deixou o
 * diálogo para depois confirma aqui. Os quatro estados: carregando, erro com "Tentar de novo", vazio (nenhum incidente afetou
 * a escola) e o dado.
 *
 * **Sempre relê ao abrir** (`refetchOnMount: 'always'`): o aviso da coordenação lê uma vez por sessão, e outra pessoa da
 * coordenação pode ter confirmado desde então. A consulta é a mesma, e a faixa e o diálogo acompanham o que esta aba leu.
 */
export function Incidentes() {
  const consulta = useQuery({ ...consultaIncidentes, refetchOnMount: 'always' })
  const { confirmar, confirmando, falha } = useConfirmarIncidente()
  if (consulta.isPending) return <EstadoCarregando rotulo="Carregando os incidentes…" />
  if (consulta.isError && consulta.data === undefined) {
    return <EstadoErro erro={consulta.error} tentando={consulta.isFetching} aoTentarDeNovo={() => void consulta.refetch({ cancelRefetch: false })} />
  }

  const { incidentes, prazoLegal } = consulta.data
  return (
    <section className="flex min-w-0 flex-col gap-3" aria-labelledby="titulo-dos-incidentes">
      <CabecalhoDeSecao
        id="titulo-dos-incidentes"
        titulo="Incidentes de segurança que afetaram a escola"
        apoio="O que a Turmma registrou, só sobre a sua escola. Aqui a coordenação confirma que recebeu cada aviso."
      />
      <Faixa>{prazoLegal}</Faixa>
      {incidentes.length === 0 ? (
        <EstadoVazio titulo="Nenhum incidente afetou esta escola" descricao="Se a Turmma registrar um incidente de segurança que alcance dados da escola, o aviso aparece aqui e ao entrar." />
      ) : (
        <ul className="flex min-w-0 flex-col gap-4">
          {incidentes.map((incidente) => (
            <li key={incidente.id} className="min-w-0">
              <CartaoDoIncidente incidente={incidente} confirmando={confirmando} falha={falha} aoConfirmar={confirmar} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
