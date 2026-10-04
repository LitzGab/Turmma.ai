import { describe, expect, it } from 'vitest'
import { estiloDoRecuo, larguraDoFlutuante, posicaoDoFlutuante, type CaixaNaJanela } from './flutuante'

const CELULAR = { largura: 360, altura: 800 }
const CHROMEBOOK = { largura: 1366, altura: 768 }

function botao(esquerda: number, topo: number, largura = 120, altura = 44): CaixaNaJanela {
  return { esquerda, direita: esquerda + largura, topo, base: topo + altura }
}

describe('largura do que flutua', () => {
  it('é 320 px, e a janela menos as duas margens quando ela é mais estreita', () => {
    expect(larguraDoFlutuante(1366)).toBe(320)
    expect(larguraDoFlutuante(360)).toBe(320)
    expect(larguraDoFlutuante(320)).toBe(288)
  })
})

describe('posição do que flutua', () => {
  it('a 360 px, o botão no meio da linha não deixa o flutuante passar da janela: ele recua para dentro', () => {
    // Borda esquerda em 150: 150 + 320 = 470, e o limite é 360 − 16 = 344. Sem o recuo, a página ganharia rolagem
    // horizontal (regra 50, item 2a).
    const { recuo } = posicaoDoFlutuante({ gatilho: botao(150, 100), janela: CELULAR, alinhamento: 'inicio', lado: 'auto', altura: 292 })
    expect(recuo).toBe(126)
    expect(150 - recuo + larguraDoFlutuante(CELULAR.largura)).toBeLessThanOrEqual(CELULAR.largura - 16)
  })

  it('alinhado ao fim, perto da borda esquerda, recua para a direita em vez de sair pela esquerda', () => {
    // Borda direita do botão em 200: o flutuante começaria em 200 − 320 = −120.
    const { recuo } = posicaoDoFlutuante({ gatilho: botao(80, 100), janela: CELULAR, alinhamento: 'fim', lado: 'auto', altura: 292 })
    expect(recuo).toBe(136)
    expect(200 + recuo - larguraDoFlutuante(CELULAR.largura)).toBeGreaterThanOrEqual(16)
  })

  it('com espaço, não recua', () => {
    expect(posicaoDoFlutuante({ gatilho: botao(24, 100), janela: CHROMEBOOK, alinhamento: 'inicio', lado: 'auto', altura: 292 }).recuo).toBe(0)
    expect(posicaoDoFlutuante({ gatilho: botao(1200, 100), janela: CHROMEBOOK, alinhamento: 'fim', lado: 'auto', altura: 292 }).recuo).toBe(0)
  })

  it('abre para baixo quando cabe, e vira para cima quando o botão está no pé da janela', () => {
    expect(posicaoDoFlutuante({ gatilho: botao(24, 100), janela: CHROMEBOOK, alinhamento: 'inicio', lado: 'auto', altura: 292 }).lado).toBe('abaixo')
    // A caixa de pedido presa embaixo: 768 − 700 − 44 = 24 px livres embaixo, 700 em cima.
    expect(posicaoDoFlutuante({ gatilho: botao(24, 700), janela: CHROMEBOOK, alinhamento: 'inicio', lado: 'auto', altura: 292 }).lado).toBe('acima')
  })

  it('sem caber em nenhum dos dois, vai para o lado com mais espaço', () => {
    const baixa = { largura: 800, altura: 400 }
    expect(posicaoDoFlutuante({ gatilho: botao(24, 120), janela: baixa, alinhamento: 'inicio', lado: 'auto', altura: 292 }).lado).toBe('abaixo')
    expect(posicaoDoFlutuante({ gatilho: botao(24, 260), janela: baixa, alinhamento: 'inicio', lado: 'auto', altura: 292 }).lado).toBe('acima')
  })

  it('o lado pedido por quem usa vale, mesmo sem espaço', () => {
    expect(posicaoDoFlutuante({ gatilho: botao(24, 700), janela: CHROMEBOOK, alinhamento: 'inicio', lado: 'abaixo', altura: 292 }).lado).toBe('abaixo')
    expect(posicaoDoFlutuante({ gatilho: botao(24, 10), janela: CHROMEBOOK, alinhamento: 'inicio', lado: 'acima', altura: 292 }).lado).toBe('acima')
  })

  it('o recuo entra na borda do alinhamento', () => {
    expect(estiloDoRecuo('inicio', 126)).toEqual({ left: -126 })
    expect(estiloDoRecuo('fim', 136)).toEqual({ right: -136 })
  })
})
