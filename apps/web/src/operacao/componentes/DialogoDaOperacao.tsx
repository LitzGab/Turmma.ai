import { useContext, useEffect, useId, useRef, type KeyboardEvent, type MouseEvent, type ReactNode, type RefObject } from 'react'
import { AvisoNoDialogo, ContextoDoAviso } from './AvisoDeInatividade'

/** O que recebe foco dentro do diálogo, na ordem do Tab. */
const FOCAVEIS = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface Props {
  readonly titulo: string
  /** Fechar: o "Cancelar", o Esc, e quem terminou o que o diálogo fazia. Quem fecha é quem desmonta. */
  readonly aoFechar: () => void
  /**
   * O clique (ou toque) fora da caixa, no fundo escurecido, também é um pedido de fechar, e vai ao `aoFechar`. Ligado só
   * no convite (tarefa 7.0), onde fechar por qualquer caminho pergunta antes; num diálogo de criação, o toque que erra a
   * caixa no celular apagaria o que foi digitado.
   */
  readonly fecharAoClicarFora?: boolean
  /**
   * O navegador fechou o diálogo sem passar pelo `aoFechar`: o Chrome não deixa o `cancel` ser segurado duas vezes seguidas
   * sem um gesto da pessoa entre elas, e o segundo Esc fecha o `dialog` direto. A tela precisa saber, para não ficar com
   * um diálogo que ela acha aberto e o navegador já fechou. Sem isto, vale o `aoFechar`.
   */
  readonly aoFecharPeloNavegador?: () => void
  /**
   * Onde o foco começa. Sem isto, o navegador o põe no primeiro controle do diálogo, que numa confirmação é o botão que
   * confirma: um Enter a mais e a ação sai sem a pessoa ter lido o que ela faz (regra 50, item 8).
   */
  readonly focoInicial?: RefObject<HTMLElement | null>
  /**
   * Para onde o foco vai ao fechar quando quem abriu o diálogo já saiu da página: o "Revogar" da escola some quando a lista
   * recarrega com o convite revogado. Sem isto, o foco cairia no `body` (regra 50, item 11).
   */
  readonly focoDeReserva?: () => void
  readonly children: ReactNode
}

/**
 * O diálogo das telas da operação (Nova rede, Nova escola; Tech Spec da A0b, seção 9), no padrão do `LoginPorCima` do F1:
 * o `dialog` nativo em modo modal, que deixa o resto da página inerte. Existe só enquanto está aberto: o que ele guarda
 * (o id do pedido, o que foi digitado) nasce na abertura e morre no fechamento.
 *
 * Duas coisas o navegador não garante sozinho, e por isso estão aqui (cenário W8):
 * - **o foco preso**: no fim da ordem, o Tab do Chrome sai do diálogo para a barra do navegador; aqui ele volta ao
 *   primeiro controle, e o Shift+Tab no primeiro vai ao último;
 * - **o foco devolvido** a quem abriu (o botão "Nova rede", por exemplo), ao fechar por qualquer caminho;
 * - **o aviso de inatividade** alcançável: fora do diálogo modal ele ficaria inerte, e por isso aparece aqui dentro
 *   enquanto o diálogo está aberto (`AvisoDeInatividade.tsx`).
 *
 * O Esc fecha, como o "Cancelar": não há nada de irreversível em fechar um diálogo de criação, e o pedido que já saiu
 * volta sozinho pelo id, se a pessoa abrir de novo e repetir. No convite, o Esc e o clique fora vão ao `aoFechar` dele,
 * que pergunta antes de fechar sem o link copiado (tarefa 7.0).
 */
export function DialogoDaOperacao({ titulo, aoFechar, fecharAoClicarFora = false, aoFecharPeloNavegador, focoInicial, focoDeReserva, children }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null)
  // Quem fecha o `dialog` somos nós, ao desmontar; o `close` que chega sem isso veio do navegador.
  const desmontando = useRef(false)
  // O `focoDeReserva` da última renderização: a limpeza do efeito roda uma vez só, ao desmontar.
  const reserva = useRef(focoDeReserva)
  useEffect(() => {
    reserva.current = focoDeReserva
  }, [focoDeReserva])
  // Onde o botão do mouse (ou o dedo) desceu: o "fora" só vale se começou fora. Selecionar o link arrastando e soltar
  // fora da caixa não é pedido de fechar.
  const comecouFora = useRef(false)
  const idDoTitulo = useId()
  const registrarDialogo = useContext(ContextoDoAviso)?.registrarDialogo

  // Aberto, o diálogo deixa a casca inerte: a casca para de desenhar o aviso de inatividade, e ele aparece aqui dentro.
  useEffect(() => registrarDialogo?.(), [registrarDialogo])

  useEffect(() => {
    const atual = dialogo.current
    if (atual === null) return
    // Quem abriu é quem tinha o foco antes do `showModal`: o clique e o Enter num botão deixam o foco nele.
    const quemAbriu = document.activeElement instanceof HTMLElement ? document.activeElement : undefined
    // `showModal` duas vezes lança: sob `StrictMode` o efeito roda de novo com o diálogo ainda aberto.
    desmontando.current = false
    if (!atual.open) atual.showModal()
    focoInicial?.current?.focus()
    return () => {
      desmontando.current = true
      if (atual.open) atual.close()
      if (quemAbriu?.isConnected === true) quemAbriu.focus()
      else reserva.current?.()
    }
    // O `focoInicial` é um `useRef` de quem desenha o diálogo: o mesmo objeto enquanto o diálogo vive.
  }, [focoInicial])

  function prenderOFoco(evento: KeyboardEvent<HTMLDialogElement>): void {
    if (evento.key !== 'Tab' || dialogo.current === null) return
    const focaveis = Array.from(dialogo.current.querySelectorAll<HTMLElement>(FOCAVEIS))
    const primeiro = focaveis[0]
    const ultimo = focaveis.at(-1)
    const ativo = document.activeElement
    if (primeiro === undefined || ultimo === undefined || ativo === null) return
    // O foco pode estar fora da ordem do Tab — o título da etapa, focado por código (`tabIndex={-1}`) —, e então o limite
    // não é "estar no primeiro", e sim "não haver controle antes" (ou depois) dele.
    const haAntes = focaveis.some((elemento) => elemento !== ativo && (elemento.compareDocumentPosition(ativo) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0)
    const haDepois = focaveis.some((elemento) => elemento !== ativo && (elemento.compareDocumentPosition(ativo) & Node.DOCUMENT_POSITION_PRECEDING) !== 0)
    if (evento.shiftKey && !haAntes) {
      evento.preventDefault()
      ultimo.focus()
    } else if (!evento.shiftKey && !haDepois) {
      evento.preventDefault()
      primeiro.focus()
    }
  }

  /** O ponto está fora da caixa do `dialog`? O clique no próprio `dialog` fora dela é o fundo. */
  function foraDaCaixa(evento: MouseEvent<HTMLDialogElement>): boolean {
    if (evento.target !== evento.currentTarget) return false
    const caixa = evento.currentTarget.getBoundingClientRect()
    return evento.clientX < caixa.left || evento.clientX > caixa.right || evento.clientY < caixa.top || evento.clientY > caixa.bottom
  }

  function clicarFora(evento: MouseEvent<HTMLDialogElement>): void {
    const comecou = comecouFora.current
    comecouFora.current = false
    if (fecharAoClicarFora && comecou && foraDaCaixa(evento)) aoFechar()
  }

  return (
    <dialog
      ref={dialogo}
      aria-labelledby={idDoTitulo}
      onCancel={(evento) => {
        evento.preventDefault()
        aoFechar()
      }}
      onClose={() => {
        // O `close` chega depois, numa tarefa à parte: sob `StrictMode` o efeito fecha e reabre, e o `close` do fechamento
        // de mentira encontra o diálogo aberto de novo. Só o que o deixou fechado é do navegador.
        if (!desmontando.current && dialogo.current?.open === false) (aoFecharPeloNavegador ?? aoFechar)()
      }}
      onMouseDown={(evento) => (comecouFora.current = foraDaCaixa(evento))}
      onClick={clicarFora}
      onKeyDown={prenderOFoco}
      className="w-[min(32rem,calc(100%-2rem))] overflow-y-auto rounded-caixa border border-linha bg-superficie p-5 text-tinta shadow-flutua sm:p-6"
    >
      <h2 id={idDoTitulo} className="text-lg font-semibold">
        {titulo}
      </h2>
      {children}
      <AvisoNoDialogo />
    </dialog>
  )
}
