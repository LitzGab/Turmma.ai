// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { arquivosDeCodigoDaWeb, codigoSemComentarioNemTexto } from '../../../__fixtures__/perigo-cheio'
import { CabecaOnca, type TamanhoDaCabeca } from './CabecaOnca'

/**
 * A cabeça da onça (RF10 da X1; `docs/interface.md` 9.7; D58, D59; regra 70, itens 4a e 4b): um desenho só, parado, sem
 * nome. O que o navegador pinta — o círculo, o anel, o fundo — é do `AvatarAgente`; aqui está o que o `jsdom` sabe: o
 * SVG como ele é, e o que ele não tem.
 */
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const TAMANHOS: readonly TamanhoDaCabeca[] = [24, 32, 40, 48]
const RAIZ_DA_WEB = join(import.meta.dirname, '..', '..', '..')
const RAIZ_DO_REPOSITORIO = join(RAIZ_DA_WEB, '..', '..', '..')

/** As nove cores da 9.7, lidas do documento: o desenho obedece a ele, e não a uma cópia que o teste faria. */
function coresDaOnca(): Set<string> {
  const documento = readFileSync(join(RAIZ_DO_REPOSITORIO, 'docs', 'interface.md'), 'utf8')
  const inicio = documento.indexOf('### 9.7 A onça e o avatar dos agentes')
  const fim = documento.indexOf('**O avatar** (`AvatarAgente`)', inicio)
  expect(inicio, 'a 9.7 do documento mudou de lugar').toBeGreaterThan(-1)
  expect(fim, 'a 9.7 do documento mudou de lugar').toBeGreaterThan(inicio)
  return new Set([...documento.slice(inicio, fim).matchAll(/#[0-9A-Fa-f]{6}\b/g)].map(([cor]) => cor.toUpperCase()))
}

function desenhar(tamanho: TamanhoDaCabeca) {
  return render(<CabecaOnca tamanho={tamanho} />)
}

describe('CabecaOnca', () => {
  it('é um SVG só, escondido da leitura de tela, sem título, sem descrição, sem nome e sem texto', () => {
    for (const tamanho of TAMANHOS) {
      const { container, unmount } = desenhar(tamanho)
      const svg = container.querySelector('svg')
      expect(container.querySelectorAll('svg'), String(tamanho)).toHaveLength(1)
      expect(svg?.getAttribute('aria-hidden'), String(tamanho)).toBe('true')
      expect(svg?.getAttribute('focusable'), String(tamanho)).toBe('false')
      // "Onça" não é o nome de agente nenhum: o desenho não diz nada, e quem assina é a função ao lado.
      expect(container.querySelectorAll('title, desc, text, tspan'), String(tamanho)).toHaveLength(0)
      for (const atributo of ['aria-label', 'aria-labelledby', 'aria-describedby', 'role', 'title', 'alt']) expect(svg?.hasAttribute(atributo), `${tamanho} ${atributo}`).toBe(false)
      expect(container.textContent, String(tamanho)).toBe('')
      unmount()
    }
  })

  it('o tamanho é só o tamanho: a mesma cabeça, na caixa de 24, 32, 40 ou 48 px', () => {
    const formas = new Set<string>()
    for (const tamanho of TAMANHOS) {
      const { container, unmount } = desenhar(tamanho)
      const svg = container.querySelector('svg') as SVGElement
      expect(svg.getAttribute('width')).toBe(String(tamanho))
      expect(svg.getAttribute('height')).toBe(String(tamanho))
      expect(svg.getAttribute('viewBox')).toBe('0 0 48 48')
      formas.add(svg.innerHTML)
      unmount()
    }
    // Um desenho só: nenhum tamanho tira ou põe um detalhe.
    expect(formas.size).toBe(1)
  })

  it('dois renders do mesmo tamanho dão o mesmo HTML: nada muda com o tempo, com a ordem nem com quem usa', () => {
    for (const tamanho of TAMANHOS) {
      const primeiro = desenhar(tamanho)
      const html = primeiro.container.innerHTML
      primeiro.unmount()
      const segundo = desenhar(tamanho)
      expect(segundo.container.innerHTML, String(tamanho)).toBe(html)
      segundo.unmount()
    }
  })

  it('está parada: nenhum `animate`, nenhum `style`, nenhuma classe de animação ou de transição, e nenhum temporizador', () => {
    vi.useFakeTimers()
    const { container } = desenhar(48)
    expect(vi.getTimerCount()).toBe(0)
    expect(container.querySelectorAll('animate, animateTransform, animateMotion, set, style, script, foreignObject, image')).toHaveLength(0)
    for (const elemento of container.querySelectorAll('*')) {
      expect(elemento.hasAttribute('style'), elemento.outerHTML).toBe(false)
      expect(elemento.getAttribute('class') ?? '', elemento.outerHTML).not.toMatch(/animate|transition|duration|delay|pulse|spin|bounce|ping/)
      for (const { name } of elemento.attributes) expect(name, elemento.outerHTML).not.toMatch(/^(?:on|begin|dur$|repeatCount|attributeName)/)
    }
  })

  it('são as nove cores da 9.7, sem degradê, e a única linha é o "w" da boca: sem contorno', () => {
    const permitidas = coresDaOnca()
    expect(permitidas.size, 'a 9.7 declara nove cores fixas').toBe(9)
    const { container } = desenhar(48)
    const usadas = new Set<string>()
    for (const elemento of container.querySelectorAll('[fill], [stroke]')) {
      for (const atributo of ['fill', 'stroke'] as const) {
        const valor = elemento.getAttribute(atributo)
        if (valor !== null && valor !== 'none') usadas.add(valor.toUpperCase())
      }
    }
    expect([...usadas].filter((cor) => !permitidas.has(cor))).toEqual([])
    // As cores do corpo, as do rosto e a do traço da boca: o desenho não é só uma cor.
    expect(usadas.size).toBeGreaterThanOrEqual(7)
    expect(container.querySelectorAll('linearGradient, radialGradient, filter, mask, clipPath, defs, use, pattern')).toHaveLength(0)
    expect(container.innerHTML).not.toMatch(/url\(/)
    // Contorno em forma nenhuma: a única que tem `stroke` é a boca, que é uma linha e não tem preenchimento.
    const comTraco = [...container.querySelectorAll('[stroke]')]
    expect(comTraco.map((elemento) => elemento.tagName.toLowerCase())).toEqual(['path'])
    expect(comTraco[0]?.getAttribute('fill')).toBe('none')
  })

  it('cada cor está na parte dela: a sombra no rosto de trás, o realce no topo, o creme dentro da orelha e no focinho, e o resto', () => {
    const { container } = desenhar(48)
    // [seletor da parte, quantas são, a cor dela na 9.7]. Trocar a sombra pelo realce, ou o creme pela pelagem, deixa vermelho.
    const partes: readonly (readonly [string, number, string])[] = [
      ['circle[cy="13.5"][r="6.5"]', 2, '#E8732E'], // as orelhas, de pelagem
      ['circle[cy="11.5"][r="2.6"]', 2, '#FDEBDD'], // o creme por dentro da orelha
      ['rect[y="14"][width="36"]', 1, '#D75F18'], // o rosto de trás: a sombra, que só aparece embaixo
      ['rect[y="11.5"][width="36"]', 1, '#E8732E'], // o rosto, de pelagem
      ['rect[width="10"]', 1, '#ED935D'], // o realce do topo
      ['circle[r="1.5"], circle[r="1.2"]', 5, '#7A3412'], // as cinco rosetas
      ['rect[width="17"]', 1, '#FDEBDD'], // o focinho, em creme
      ['rect[width="6"]', 1, '#E5838C'], // o nariz
      ['circle[r="3.4"]', 2, '#FFFFFF'], // o branco do olho
      ['circle[r="1.9"]', 2, '#16233E'], // a pupila
    ]
    let cobertas = 0
    for (const [seletor, quantas, cor] of partes) {
      const achadas = [...container.querySelectorAll(seletor)]
      expect(achadas, seletor).toHaveLength(quantas)
      for (const parte of achadas) expect(parte.getAttribute('fill')?.toUpperCase(), seletor).toBe(cor)
      cobertas += achadas.length
    }
    // A boca é o traço, na cor da pupila; e nenhuma forma fica sem dono: o desenho não ganha parte que o teste não nomeia.
    expect(container.querySelector('path')?.getAttribute('stroke')?.toUpperCase()).toBe('#16233E')
    expect(container.querySelectorAll('circle, rect, path')).toHaveLength(cobertas + 1)
  })

  it('só tem a prop `tamanho`, e `tamanho` só aceita os quatro valores do avatar', () => {
    // @ts-expect-error a cabeça é um desenho só: nenhuma pose
    render(<CabecaOnca tamanho={24} pose="acenando" />)
    // @ts-expect-error nenhum "pensando", e nenhum temporizador por trás dele
    render(<CabecaOnca tamanho={24} pensando />)
    // @ts-expect-error nenhum humor nem expressão que mude com quem usa
    render(<CabecaOnca tamanho={24} humor="feliz" />)
    // @ts-expect-error o tamanho é um dos quatro do avatar
    render(<CabecaOnca tamanho={20} />)
    // @ts-expect-error sem `tamanho` não há desenho: quem decide o tamanho é o avatar
    render(<CabecaOnca />)
  })
})

describe('a pasta da onça', () => {
  const daPasta = arquivosDeCodigoDaWeb(RAIZ_DA_WEB).filter((nome) => nome.startsWith('componentes/ui/onca/'))

  it('não tem temporizador, efeito nem estado: `setTimeout`, `setInterval`, `useEffect` e `useState` não aparecem', () => {
    // Sem esta âncora o caso passaria vazio no dia em que a pasta mudasse de nome.
    expect(daPasta).toContain('componentes/ui/onca/CabecaOnca.tsx')
    for (const nome of daPasta) {
      const codigo = codigoSemComentarioNemTexto(readFileSync(join(RAIZ_DA_WEB, nome), 'utf8'))
      expect(codigo, nome).not.toMatch(/\b(?:setTimeout|setInterval|requestAnimationFrame|useEffect|useLayoutEffect|useState|useReducer|useRef|useId)\b/)
    }
  })

  it('não escreve animação nem transição: nem classe, nem `style`, nem `<animate>`', () => {
    for (const nome of daPasta) {
      const fonte = readFileSync(join(RAIZ_DA_WEB, nome), 'utf8')
      expect(fonte, nome).not.toMatch(/<animate|<set\b|\bstyle=|\banimate-|\btransition|\banimation\b/)
    }
  })
})
