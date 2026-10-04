import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'

/**
 * Onde abre o que flutua preso a um botão — o menu, o cartão do chip de fonte —, sem biblioteca de posicionamento: o
 * `@floating-ui` que o Radix traz é a maior parte dos 30 kB do menu dele (regra 50, item 1). A conta que importa cabe
 * aqui e tem teste: para que lado abrir, e quanto puxar para dentro para **não passar da largura da janela a 360 px**
 * (regra 50, item 2a).
 */

/** O respiro entre o que flutua e a borda da janela: a margem da página no celular (9.3). */
export const MARGEM_DA_JANELA = 16

/** A largura do que flutua: 320 px (11.2), ou a janela menos as duas margens quando ela é mais estreita que isso. */
export const LARGURA_MAXIMA_DO_FLUTUANTE = 320

export interface CaixaNaJanela {
  readonly esquerda: number
  readonly direita: number
  readonly topo: number
  readonly base: number
}

export interface PosicaoDoFlutuante {
  readonly lado: 'acima' | 'abaixo'
  /** Quantos px puxar para dentro da janela, a partir da borda de alinhamento do botão. Zero quando já cabe. */
  readonly recuo: number
}

export interface PedidoDePosicao {
  /** Onde está o botão, em px da janela (`getBoundingClientRect`). */
  readonly gatilho: CaixaNaJanela
  readonly janela: { readonly largura: number; readonly altura: number }
  /** `inicio` alinha a borda esquerda com a do botão; `fim`, a direita. */
  readonly alinhamento: 'inicio' | 'fim'
  /** `auto` abre para baixo, e vira para cima quando a janela é baixa (11.2). */
  readonly lado: 'auto' | 'acima' | 'abaixo'
  /** A altura que o flutuante pode chegar a ter. */
  readonly altura: number
}

export function larguraDoFlutuante(larguraDaJanela: number): number {
  return Math.max(0, Math.min(LARGURA_MAXIMA_DO_FLUTUANTE, larguraDaJanela - 2 * MARGEM_DA_JANELA))
}

export function posicaoDoFlutuante({ gatilho, janela, alinhamento, lado, altura }: PedidoDePosicao): PosicaoDoFlutuante {
  const largura = larguraDoFlutuante(janela.largura)
  const abaixo = janela.altura - gatilho.base
  const acima = gatilho.topo
  // Cabe embaixo, fica embaixo. Não cabe: vai para o lado que tem mais espaço, e lá rola por dentro.
  const ladoEscolhido = lado !== 'auto' ? lado : abaixo >= altura + MARGEM_DA_JANELA || abaixo >= acima ? 'abaixo' : 'acima'
  const limiteEsquerdo = MARGEM_DA_JANELA
  const limiteDireito = janela.largura - MARGEM_DA_JANELA
  // Alinhado ao início, o que sobra é à direita, e o recuo puxa para a esquerda; alinhado ao fim, o contrário.
  const sobra = alinhamento === 'inicio' ? gatilho.esquerda + largura - limiteDireito : limiteEsquerdo - (gatilho.direita - largura)
  return { lado: ladoEscolhido, recuo: Math.max(0, Math.round(sobra)) }
}

export interface OpcoesDoFlutuante {
  readonly aberto: boolean
  /** O toque ou o clique fora pede para fechar. O Esc é de quem desenha, que sabe para onde o foco volta. */
  readonly aoFechar: () => void
  readonly alinhamento: 'inicio' | 'fim'
  readonly lado: 'auto' | 'acima' | 'abaixo'
  readonly altura: number
}

/**
 * A âncora (o elemento que envolve o botão e o que flutua) e a posição medida na abertura. Mede antes de pintar
 * (`useLayoutEffect`), para o flutuante não aparecer num lugar e pular para outro; mede de novo se a janela muda de
 * tamanho. Fecha no `pointerdown` fora da âncora, que vale para mouse, toque e caneta.
 */
export function useFlutuante<Ancora extends HTMLElement>({ aberto, aoFechar, alinhamento, lado, altura }: OpcoesDoFlutuante): {
  readonly ancora: RefObject<Ancora | null>
  readonly posicao: PosicaoDoFlutuante
} {
  const ancora = useRef<Ancora>(null)
  const [posicao, definirPosicao] = useState<PosicaoDoFlutuante>({ lado: lado === 'acima' ? 'acima' : 'abaixo', recuo: 0 })
  // O `aoFechar` da última renderização, para o ouvinte do documento não ser trocado a cada render de quem usa.
  const fechar = useRef(aoFechar)
  useEffect(() => {
    fechar.current = aoFechar
  }, [aoFechar])

  useLayoutEffect(() => {
    if (!aberto) return
    function medir(): void {
      const caixa = ancora.current?.getBoundingClientRect()
      if (caixa === undefined) return
      definirPosicao(
        posicaoDoFlutuante({
          gatilho: { esquerda: caixa.left, direita: caixa.right, topo: caixa.top, base: caixa.bottom },
          janela: { largura: document.documentElement.clientWidth, altura: document.documentElement.clientHeight },
          alinhamento,
          lado,
          altura,
        }),
      )
    }
    medir()
    window.addEventListener('resize', medir)
    return () => window.removeEventListener('resize', medir)
  }, [aberto, alinhamento, lado, altura])

  useEffect(() => {
    if (!aberto) return
    function aoApontar(evento: PointerEvent): void {
      if (evento.target instanceof Node && ancora.current?.contains(evento.target) === false) fechar.current()
    }
    document.addEventListener('pointerdown', aoApontar)
    return () => document.removeEventListener('pointerdown', aoApontar)
  }, [aberto])

  return { ancora, posicao }
}

/**
 * Enquanto o menu está aberto, **o resto da página fica inerte**: tudo que não é a âncora nem um ancestral dela. É o que
 * faz do menu aberto a única coisa com que se interage — o leitor de tela não sai dele para o que está por baixo, e o
 * controle que o menu cobriu pela metade deixa de ser alvo de toque, em vez de sobrar com uma fresta de 10 px (regra
 * 50, item 2a). Ao fechar, cada elemento volta a ser o que era: só o que este gancho deixou inerte é solto.
 */
export function useRestoInerte(ativo: boolean, ancora: RefObject<HTMLElement | null>): void {
  useEffect(() => {
    const inicio = ancora.current
    if (!ativo || inicio === null) return
    const postos: HTMLElement[] = []
    for (let no: HTMLElement | null = inicio; no !== null && no !== document.body; no = no.parentElement) {
      for (const irmao of Array.from(no.parentElement?.children ?? [])) {
        if (irmao === no || !(irmao instanceof HTMLElement) || irmao.inert) continue
        irmao.inert = true
        postos.push(irmao)
      }
    }
    return () => {
      for (const elemento of postos) elemento.inert = false
    }
  }, [ativo, ancora])
}

/** O `style` do que flutua: só o recuo medido, na borda do alinhamento. O resto do desenho é classe. */
export function estiloDoRecuo(alinhamento: 'inicio' | 'fim', recuo: number): { left: number } | { right: number } {
  return alinhamento === 'inicio' ? { left: -recuo } : { right: -recuo }
}
