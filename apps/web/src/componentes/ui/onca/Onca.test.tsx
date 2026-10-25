// @vitest-environment jsdom
import { AGENTES } from '@educa/shared'
import { cleanup, render } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { arquivosDeCodigoDaWeb, codigoSemComentarioNemTexto } from '../../../__fixtures__/perigo-cheio'
import { CabecaOnca } from './CabecaOnca'
import { Onca, POSES, type Pose, type TamanhoDaOnca } from './Onca'

/**
 * A onça de corpo inteiro (tarefa 5.0 da X4; RF19; `docs/interface.md` 9.7; D58, D59; regra 70, itens 4a e 4b): três poses,
 * o mesmo rosto neutro da cabeça da X1 em todas, sempre com a função e o selo "IA", parada. O que o navegador pinta é do
 * e2e (`introducao-pecas.spec.ts`); aqui está o que o `jsdom` sabe: o SVG como ele é, e o que ele não tem.
 */
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

const TAMANHOS: readonly TamanhoDaOnca[] = [88, 120, 160]
const RAIZ_DA_WEB = join(import.meta.dirname, '..', '..', '..')
const RAIZ_DO_REPOSITORIO = join(RAIZ_DA_WEB, '..', '..', '..')

/** As nove cores da 9.7, lidas do documento: o desenho obedece a ele, e não a uma cópia que o teste faria. */
function coresDaOnca(): Set<string> {
  const documento = readFileSync(join(RAIZ_DO_REPOSITORIO, 'docs', 'interface.md'), 'utf8')
  const inicio = documento.indexOf('### 9.7 A onça e o avatar dos agentes')
  const fim = documento.indexOf('**O avatar** (`AvatarAgente`)', inicio)
  expect(inicio, 'a 9.7 do documento mudou de lugar').toBeGreaterThan(-1)
  return new Set([...documento.slice(inicio, fim).matchAll(/#[0-9A-Fa-f]{6}\b/g)].map(([cor]) => cor.toUpperCase()))
}

function desenhar(pose: Pose, agente: (typeof AGENTES)[number] = 'tutor', tamanho: TamanhoDaOnca = 120) {
  return render(<Onca pose={pose} agente={agente} tamanho={tamanho} />)
}

/** O rosto da cabeça neutra da X1, como ela o desenha: o miolo do `svg`. */
function rostoDaCabeca(): string {
  const { container, unmount } = render(<CabecaOnca tamanho={48} />)
  const miolo = container.querySelector('svg')?.innerHTML ?? ''
  unmount()
  return miolo
}

describe('Onca: as poses', () => {
  it('são três: acenando, apontando e comemorando. Não existe "acolhendo"', () => {
    expect([...POSES]).toEqual(['acenando', 'apontando', 'comemorando'])
    for (const pose of POSES) {
      const { container, unmount } = desenhar(pose)
      expect(container.querySelector('[data-onca]')?.getAttribute('data-pose')).toBe(pose)
      unmount()
    }
    // Só o compilador a recusa: a função não roda, porque a pose não tem braços a desenhar.
    void (() =>
      // @ts-expect-error a expressão de preocupação não entra no produto (D80, item 3)
      render(<Onca pose="acolhendo" agente="tutor" tamanho={120} />))
  })

  it('só o corpo muda: as três poses dão três desenhos de corpo diferentes', () => {
    const corpos = new Set<string>()
    for (const pose of POSES) {
      const { container, unmount } = desenhar(pose)
      const rosto = container.querySelector('[data-rosto]')
      rosto?.remove()
      corpos.add(container.querySelector('svg')?.innerHTML ?? '')
      unmount()
    }
    expect(corpos.size).toBe(POSES.length)
  })

  it('o rosto de cada pose é o da cabeça neutra da X1: os mesmos olhos, focinho e boca', () => {
    const neutro = rostoDaCabeca()
    for (const pose of POSES) {
      const { container, unmount } = desenhar(pose)
      const rosto = container.querySelectorAll('[data-rosto]')
      expect(rosto, pose).toHaveLength(1)
      expect(rosto[0]?.innerHTML, pose).toBe(neutro)
      unmount()
    }
  })

  it('o rosto é conferido de verdade: uma boca trocada deixa a comparação vermelha', () => {
    const neutro = rostoDaCabeca()
    const { container } = desenhar('acenando')
    const rosto = container.querySelector('[data-rosto]')?.innerHTML ?? ''
    // A boca aberta e a boca de preocupação são o que a comparação precisa pegar.
    expect(rosto.replace('q1.8 2.2 3.6.2', 'q1.8 -2.2 3.6.2')).not.toBe(neutro)
    expect(rosto.replace('<path d="M24 33.8V36', '<path d="M24 33.8V30')).not.toBe(neutro)
    expect(rosto.replace(/<circle cx="17.5" cy="26" r="1.9"/, '<circle cx="17.5" cy="25" r="1.9"')).not.toBe(neutro)
  })
})

describe('Onca: sempre assinada, nunca pessoa', () => {
  it('traz o nome da função e o selo "IA" no mesmo bloco, para cada agente e cada pose', () => {
    for (const agente of AGENTES) {
      for (const pose of POSES) {
        const { container, unmount } = desenhar(pose, agente)
        const bloco = container.querySelector('[data-onca]') as HTMLElement
        const legenda = bloco.querySelector('figcaption') as HTMLElement
        expect(legenda.textContent, `${agente} ${pose}`).toMatch(/^(Assistente de ensino|Tutor|Analista de desempenho escolar)/)
        expect(legenda.querySelectorAll('[data-selo-ia]'), `${agente} ${pose}`).toHaveLength(1)
        expect(legenda.textContent, `${agente} ${pose}`).toContain('gerado por inteligência artificial')
        unmount()
      }
    }
  })

  it('o nome acessível é a função: nunca "onça", nunca nome de gente, e nenhum texto de sentimento', () => {
    for (const pose of POSES) {
      const { container, unmount } = desenhar(pose, 'assistente_de_ensino')
      // O nome que o leitor de tela ouve é o texto da legenda: a função e o selo. O desenho não tem nome próprio.
      expect(container.querySelector('figure')?.hasAttribute('aria-label'), pose).toBe(false)
      expect(container.querySelector('figcaption')?.textContent, pose).toMatch(/^Assistente de ensino/)
      expect(container.textContent, pose).not.toMatch(/on[çc]a/i)
      expect(container.textContent, pose).not.toMatch(/feliz|triste|orgulhos|saudade|sentiu|amig|ador|animad|preocupad|bravo|medo/i)
      expect(container.querySelectorAll('title, desc, text, tspan'), pose).toHaveLength(0)
      expect(container.querySelector('svg')?.hasAttribute('aria-label'), pose).toBe(false)
      expect(container.querySelector('svg')?.getAttribute('aria-hidden'), pose).toBe('true')
      unmount()
    }
  })

  // A prova deste caso é o `typecheck`: cada `@ts-expect-error` falha a compilação se a linha de baixo deixar de errar. Em
  // execução o caso só confere que as peças renderizam; não há `expect` aqui, de propósito.
  it('só aceita pose, agente e um dos três tamanhos', () => {
    // @ts-expect-error sem agente não há quem assine
    render(<Onca pose="acenando" tamanho={120} />)
    // @ts-expect-error nenhum humor nem expressão que mude com quem usa
    render(<Onca pose="acenando" agente="tutor" tamanho={120} humor="feliz" />)
    // @ts-expect-error o tamanho é um dos três do desenho
    render(<Onca pose="acenando" agente="tutor" tamanho={100} />)
  })
})

describe('Onca: o desenho', () => {
  it('é um SVG só por onça, na proporção do quadro, e o tamanho é só o tamanho', () => {
    const formas = new Set<string>()
    for (const tamanho of TAMANHOS) {
      const { container, unmount } = desenhar('apontando', 'tutor', tamanho)
      const svg = container.querySelector('svg') as SVGElement
      expect(container.querySelectorAll('svg')).toHaveLength(1)
      expect(svg.getAttribute('width')).toBe(String(tamanho))
      expect(svg.getAttribute('height')).toBe(String(Math.round((tamanho * 132) / 120)))
      expect(svg.getAttribute('viewBox')).toBe('0 0 120 132')
      formas.add(svg.innerHTML)
      unmount()
    }
    expect(formas.size).toBe(1)
  })

  it('dois renders da mesma pose dão o mesmo HTML, e a onça está parada: sem animação, estilo, imagem nem temporizador', () => {
    vi.useFakeTimers()
    for (const pose of POSES) {
      const primeiro = desenhar(pose)
      const html = primeiro.container.innerHTML
      expect(vi.getTimerCount(), pose).toBe(0)
      expect(primeiro.container.querySelectorAll('animate, animateTransform, animateMotion, set, style, script, foreignObject, image, img'), pose).toHaveLength(0)
      for (const elemento of primeiro.container.querySelectorAll('*')) {
        expect(elemento.hasAttribute('style'), elemento.outerHTML).toBe(false)
        expect(elemento.getAttribute('class') ?? '', elemento.outerHTML).not.toMatch(/animate|transition|duration|delay|pulse|spin|bounce|ping/)
      }
      primeiro.unmount()
      const segundo = desenhar(pose)
      expect(segundo.container.innerHTML, pose).toBe(html)
      segundo.unmount()
    }
  })

  it('usa só as nove cores da 9.7, sem degradê nem contorno em forma alguma além da boca da cabeça', () => {
    const permitidas = coresDaOnca()
    expect(permitidas.size, 'a 9.7 declara nove cores fixas').toBe(9)
    for (const pose of POSES) {
      const { container, unmount } = desenhar(pose)
      for (const elemento of container.querySelectorAll('[fill], [stroke]')) {
        for (const atributo of ['fill', 'stroke'] as const) {
          const valor = elemento.getAttribute(atributo)
          if (valor !== null && valor !== 'none') expect(permitidas.has(valor.toUpperCase()), `${pose} ${valor}`).toBe(true)
        }
      }
      expect(container.querySelectorAll('linearGradient, radialGradient, filter, mask, clipPath, defs, use, pattern'), pose).toHaveLength(0)
      expect([...container.querySelectorAll('[stroke]')].map((elemento) => elemento.tagName.toLowerCase()), pose).toEqual(['path'])
      unmount()
    }
  })

  it('o corpo é o mesmo nas três poses: o que muda são os braços', () => {
    const semBracos = new Set<string>()
    for (const pose of POSES) {
      const { container, unmount } = desenhar(pose)
      for (const braco of container.querySelectorAll('g[transform^="rotate"]')) braco.remove()
      container.querySelector('[data-rosto]')?.remove()
      semBracos.add(container.querySelector('svg')?.innerHTML ?? '')
      unmount()
    }
    expect(semBracos.size).toBe(1)
  })
})

describe('a pasta da onça com o corpo inteiro', () => {
  const daPasta = arquivosDeCodigoDaWeb(RAIZ_DA_WEB).filter((nome) => nome.startsWith('componentes/ui/onca/'))

  it('a `Onca` está na pasta e não tem temporizador, efeito nem estado', () => {
    expect(daPasta).toContain('componentes/ui/onca/Onca.tsx')
    const codigo = codigoSemComentarioNemTexto(readFileSync(join(RAIZ_DA_WEB, 'componentes/ui/onca/Onca.tsx'), 'utf8'))
    expect(codigo).not.toMatch(/\b(?:setTimeout|setInterval|requestAnimationFrame|useEffect|useLayoutEffect|useState|useReducer|useRef|useId)\b/)
  })
})
