import type { ReactNode } from 'react'

interface PropsDaFolha {
  /** O nome da folha para o leitor de tela: o do documento. */
  readonly rotulo: string
  readonly children: ReactNode
}

/**
 * A folha do documento aberto (D80; `docs/interface.md` 9.3 e 11.2, tipo **Documento**; telas do professor, 6.0): uma coluna
 * de **760 px** sobre a `mesa`, o fundo atrás dela. A folha tem canto de 16, borda de 2 px e respiro de 40; a mesa, 32 de
 * respiro à volta.
 *
 * **Abaixo de 768 px não há mesa nem borda** (o celular do mockup): a folha é a própria coluna da tela, sem mais um quadro
 * dentro do quadro, e a largura é toda da janela (360 px não rolam de lado). O sumário lateral, o "Lado a lado" e as outras
 * vistas do mockup são do F7 e não entram aqui.
 *
 * A peça não sabe o que mostra: quem a usa põe o conteúdo, e a página de origem de cada questão vem dele.
 */
export function Folha({ rotulo, children }: PropsDaFolha) {
  return (
    <div data-mesa="" className="min-w-0 md:rounded-cartao md:bg-mesa md:p-8">
      <article data-folha="" aria-label={rotulo} className="mx-auto flex w-full max-w-[760px] min-w-0 flex-col gap-4 md:rounded-cartao md:border-2 md:border-borda md:bg-superficie md:p-10">
        {children}
      </article>
    </div>
  )
}
