// @vitest-environment jsdom
import { cleanup, render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { codigoSemComentarioNemTexto } from '../../__fixtures__/perigo-cheio'
import { Comemoracao } from './Comemoracao'

/**
 * A comemoração (tarefa 5.0 da X4; RF8, RF19; D59): um salto da onça `comemorando`, em CSS, uma iteração, parado com "reduzir
 * movimento", sem som e sem número. O `jsdom` não calcula `animation-name`: o CSS é lido como texto aqui (`Comemoracao.css`), e
 * o que o navegador resolve — `animationName` com e sem "reduzir movimento" — está em `e2e/introducao-pecas.spec.ts`.
 */
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const RAIZ = join(import.meta.dirname, '..', '..')
const CSS = readFileSync(join(RAIZ, 'componentes/ui/Comemoracao.css'), 'utf8')
const FONTE = readFileSync(join(RAIZ, 'componentes/ui/Comemoracao.tsx'), 'utf8')

/** O miolo do bloco que abre na primeira `{` depois de `inicio`, até a `}` que o fecha. */
function bloco(texto: string, inicio: number): string {
  const abertura = texto.indexOf('{', inicio)
  let profundidade = 0
  for (let posicao = abertura; posicao < texto.length; posicao++) {
    if (texto[posicao] === '{') profundidade++
    else if (texto[posicao] === '}' && --profundidade === 0) return texto.slice(abertura + 1, posicao)
  }
  throw new Error('bloco de CSS sem fechamento')
}

describe('Comemoracao: o que aparece', () => {
  it('é a onça comemorando, com a função e o selo "IA", e a frase de quem a monta', () => {
    const { container } = render(<Comemoracao agente="tutor">Atividade enviada.</Comemoracao>)
    expect(container.querySelector('[data-onca]')?.getAttribute('data-pose')).toBe('comemorando')
    expect(container.querySelector('figcaption')?.textContent).toMatch(/^Tutor/)
    expect(container.querySelectorAll('[data-selo-ia]')).toHaveLength(1)
    expect(container.textContent).toContain('Atividade enviada.')
  })

  it('sem frase, só a onça: nada de texto inventado pela peça', () => {
    const { container } = render(<Comemoracao agente="tutor" />)
    expect(container.querySelectorAll('p')).toHaveLength(0)
  })

  it('o salto está num bloco só, em volta da onça, e o texto fica parado', () => {
    const { container } = render(<Comemoracao agente="tutor">Atividade enviada.</Comemoracao>)
    const saltos = container.querySelectorAll('.comemoracao-salto')
    expect(saltos).toHaveLength(1)
    expect(saltos[0]?.querySelector('[data-onca]')).not.toBeNull()
    expect(saltos[0]?.textContent).not.toContain('Atividade enviada.')
  })

  it('não tem número, som nem temporizador', () => {
    vi.useFakeTimers()
    const { container } = render(<Comemoracao agente="tutor">Atividade enviada.</Comemoracao>)
    expect(vi.getTimerCount()).toBe(0)
    expect(container.querySelectorAll('audio, video, source, embed, object')).toHaveLength(0)
    expect(container.textContent).not.toMatch(/\d/)
    const codigo = codigoSemComentarioNemTexto(FONTE)
    expect(codigo).not.toMatch(/\b(?:Audio|AudioContext|setTimeout|setInterval|requestAnimationFrame|useEffect|useLayoutEffect|useState|useReducer)\b/)
  })
})

describe('Comemoracao.css: o movimento', () => {
  const inicioDosFrames = CSS.indexOf('@keyframes comemoracao-salto')
  const quadros = bloco(CSS, inicioDosFrames)

  it('o salto muda só `transform` e `opacity`', () => {
    expect(inicioDosFrames, 'os @keyframes sumiram').toBeGreaterThan(-1)
    const propriedades = new Set([...quadros.matchAll(/([a-z-]+)\s*:/g)].map(([, nome]) => nome))
    expect([...propriedades].sort()).toEqual(['opacity', 'transform'])
  })

  it('roda uma vez: `animation-iteration-count: 1`, e `infinite` não aparece em lugar nenhum', () => {
    expect(CSS).toMatch(/\.comemoracao-salto\s*\{[^}]*animation-iteration-count:\s*1\s*;/)
    expect(CSS).not.toMatch(/infinite/)
    expect(CSS).not.toMatch(/animation-direction:\s*(?:alternate|reverse)/)
  })

  it('com "reduzir movimento", a animação é `none`', () => {
    const inicio = CSS.indexOf('@media (prefers-reduced-motion: reduce)')
    expect(inicio, 'o bloco de "reduzir movimento" sumiu').toBeGreaterThan(-1)
    expect(bloco(CSS, inicio)).toMatch(/\.comemoracao-salto\s*\{\s*animation:\s*none;\s*\}/)
  })

  it('a peça carrega o CSS, e o salto não depende de estilo em linha', () => {
    expect(FONTE).toMatch(/import '\.\/Comemoracao\.css'/)
    const { container } = render(<Comemoracao agente="tutor" />)
    for (const elemento of container.querySelectorAll('*')) expect(elemento.hasAttribute('style'), elemento.outerHTML).toBe(false)
  })
})
