import type { ReactNode } from 'react'

/**
 * As três larguras de conteúdo da 9.3 do `docs/interface.md`: 760 px em leitura e conversa, 1040 px em formulário e
 * 1480 px em grade e tabela. Fluida até o teto: abaixo dele a tela ocupa o que a janela dá.
 */
const LARGURA_DA_TELA = { conversa: 'max-w-[760px]', formulario: 'max-w-[1040px]', grade: 'max-w-[1480px]' } as const
export type LarguraDaTela = keyof typeof LARGURA_DA_TELA

interface PropsDaTela {
  /**
   * O nome da tela. Em aba de navegação ele existe **só para o leitor de tela**: a lateral já diz onde a pessoa está, e
   * aba não tem título nem descrição (D72; `docs/interface.md` 6). O título da aba do navegador continua com quem
   * escreve a tela (`useTituloDaTela`).
   */
  readonly titulo: string
  readonly largura?: LarguraDaTela
  /**
   * Tela de **objeto** — uma atividade aberta, o formulário de uma ferramenta, a turma aberta —: aí o título é o nome da
   * coisa, e aparece.
   */
  readonly objeto?: boolean
  /** Uma linha de apoio embaixo do título de objeto. */
  readonly descricao?: string
  /** Os controles da tela: na tela de objeto, ao lado do título; na aba, a barra do topo (abas, filtros, busca). */
  readonly acoes?: ReactNode
  /** O que vem antes do título: o "Voltar" da tela de objeto. */
  readonly antes?: ReactNode
  /**
   * A tela põe a margem da página ela mesma. **Só fora da casca** (a galeria, uma página pública): dentro da casca da
   * escola a margem já é do `main` dela, e com as duas a tela ficaria com 32 px de cada lado a 360 px.
   */
  readonly comMargem?: boolean
  readonly children: ReactNode
}

/**
 * A moldura de toda tela, com o padrão de espaço do sistema (D72; P03; `docs/interface.md` 6 e 9.3): a coluna na largura
 * da 9.3 e 16 px entre blocos. **A margem da página é da casca** (`CascaDaEscola`: 16 px no celular e 24 px a partir de
 * 768 px, topo de 16 a 20 px, fim de 32 px), e por isso a `Tela` não a repete; fora da casca, `comMargem` põe a mesma.
 * A casca limita o conteúdo a 1024 px: a largura `grade` só passa disso quando a casca deixar.
 *
 * `min-w-0` na coluna é o que deixa um filho largo (tabela, linha de abas) rolar por dentro em vez de empurrar a página
 * a 360 px (regra 50, item 2a).
 */
export function Tela({ titulo, largura = 'grade', objeto = false, descricao, acoes, antes, comMargem = false, children }: PropsDaTela) {
  return (
    <div data-tela={largura} className={`mx-auto flex w-full min-w-0 flex-col gap-4 ${comMargem ? 'px-4 pt-4 pb-8 md:px-6 md:pt-5' : ''} ${LARGURA_DA_TELA[largura]}`}>
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
        <>
          <h1 className="sr-only">{titulo}</h1>
          {acoes !== undefined && <div className="flex min-w-0 flex-wrap items-center gap-2">{acoes}</div>}
        </>
      )}
      {children}
    </div>
  )
}

/**
 * O nível do título de uma seção, de um cartão ou de um formulário. A peça não sabe onde foi posta: dentro de um cartão
 * que já é `h2`, o título de dentro é `h3`. Quem monta a tela diz o nível, para a ordem dos títulos não pular.
 */
export type NivelDoTitulo = 2 | 3 | 4

interface PropsDoCabecalhoDeSecao {
  readonly titulo: string
  /** Sem ele, 2: a seção direto dentro da tela. */
  readonly nivel?: NivelDoTitulo
  /** O id do título, para a `section` de quem usa apontar para ele com `aria-labelledby`. */
  readonly id?: string
  readonly apoio?: string
  /** No máximo uma ação à direita, em `discreto` ou `secundario`. */
  readonly acao?: ReactNode
}

/** O cabeçalho de uma seção dentro da tela: título de cartão (16 px, peso 600), uma linha de apoio e, à direita, uma ação. */
export function CabecalhoDeSecao({ titulo, nivel = 2, id, apoio, acao }: PropsDoCabecalhoDeSecao) {
  const Titulo = `h${nivel}` as const
  return (
    <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-4 gap-y-2">
      <div className="min-w-0">
        <Titulo {...(id === undefined ? {} : { id })} className="text-base leading-snug font-semibold break-words text-tinta">
          {titulo}
        </Titulo>
        {apoio !== undefined && <p className="mt-0.5 text-sm break-words text-sutil">{apoio}</p>}
      </div>
      {acao}
    </div>
  )
}
