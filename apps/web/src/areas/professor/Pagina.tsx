import type { ReactNode } from 'react'

/** As larguras de conteúdo da 9.3 do `docs/interface.md` que a área do professor usa: 760 px na conversa, 1040 px no formulário. */
const LARGURA = { conversa: 'max-w-[760px]', formulario: 'max-w-[1040px]' } as const

interface PropsDaPagina {
  /**
   * O nome da tela. Em aba de navegação ele existe **só para o leitor de tela**: a lateral já diz onde a pessoa está
   * (D72; `docs/interface.md` 6). O título da aba do navegador é de quem escreve a tela (`useTituloDaTela`).
   */
  readonly titulo: string
  readonly largura?: keyof typeof LARGURA
  /** Tela de **objeto** (um artefato aberto, o formulário de uma ferramenta): aí o título é o nome da coisa, e aparece. */
  readonly objeto?: boolean
  readonly descricao?: string
  /** O que vem antes do título de objeto: o "Voltar". */
  readonly antes?: ReactNode
  /** As ações da tela de objeto, ao lado do título. */
  readonly acoes?: ReactNode
  readonly children: ReactNode
}

/**
 * A moldura das telas do Assistente, com o padrão de espaço do sistema (D72; P03): a coluna na largura da 9.3 e 16 px
 * entre blocos. A margem da página (16 px no celular, 24 a partir de 768) **já é da casca** (`CascaDaEscola`, o `main`):
 * a peça `Tela` de `componentes/` põe a margem de novo, e dentro da casca a tela ficaria com 32 px de cada lado a 360 px.
 * Por isso a moldura daqui não tem margem; o resto é o mesmo desenho.
 */
export function Pagina({ titulo, largura = 'formulario', objeto = false, descricao, antes, acoes, children }: PropsDaPagina) {
  return (
    <div className={`mx-auto flex w-full min-w-0 flex-col gap-4 ${LARGURA[largura]}`}>
      {antes}
      {objeto ? (
        <header className="flex min-w-0 flex-wrap items-center justify-between gap-x-6 gap-y-3">
          <div className="min-w-0">
            <h1 className="text-[22px] leading-tight font-semibold break-words text-tinta">{titulo}</h1>
            {descricao !== undefined && <p className="mt-1 text-sm break-words text-sutil">{descricao}</p>}
          </div>
          {acoes !== undefined && <div className="flex min-w-0 flex-wrap items-center gap-2">{acoes}</div>}
        </header>
      ) : (
        <h1 className="sr-only">{titulo}</h1>
      )}
      {children}
    </div>
  )
}
