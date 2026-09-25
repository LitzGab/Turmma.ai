import { useContext, useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { AvisoNoDialogo, ContextoDoAviso } from './AvisoDeInatividade'

/** O que recebe foco dentro do diálogo, na ordem do Tab. */
const FOCAVEIS = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface Props {
  readonly titulo: string
  /** Fechar: o "Cancelar", o Esc, e quem terminou o que o diálogo fazia. Quem fecha é quem desmonta. */
  readonly aoFechar: () => void
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
 * volta sozinho pelo id, se a pessoa abrir de novo e repetir.
 */
export function DialogoDaOperacao({ titulo, aoFechar, children }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null)
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
    if (!atual.open) atual.showModal()
    return () => {
      if (atual.open) atual.close()
      if (quemAbriu?.isConnected === true) quemAbriu.focus()
    }
  }, [])

  function prenderOFoco(evento: KeyboardEvent<HTMLDialogElement>): void {
    if (evento.key !== 'Tab' || dialogo.current === null) return
    const focaveis = Array.from(dialogo.current.querySelectorAll<HTMLElement>(FOCAVEIS))
    const primeiro = focaveis[0]
    const ultimo = focaveis.at(-1)
    if (primeiro === undefined || ultimo === undefined) return
    if (evento.shiftKey && document.activeElement === primeiro) {
      evento.preventDefault()
      ultimo.focus()
    } else if (!evento.shiftKey && document.activeElement === ultimo) {
      evento.preventDefault()
      primeiro.focus()
    }
  }

  return (
    <dialog
      ref={dialogo}
      aria-labelledby={idDoTitulo}
      onCancel={(evento) => {
        evento.preventDefault()
        aoFechar()
      }}
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
