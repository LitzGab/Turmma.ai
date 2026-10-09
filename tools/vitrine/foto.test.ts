import { describe, expect, it } from 'vitest'
import { baseDaFoto, ehPapel, fotosAnteriores, nomeDaFoto, pedacos } from './foto.ts'

describe('o nome do arquivo da foto', () => {
  it('leva o papel, o endereço e a tela, sem a consulta nem o fragmento', () => {
    expect(nomeDaFoto(baseDaFoto('coordenacao', '/coordenacao/privacidade/retencao?aba=1#topo', 'celular'))).toBe('coordenacao--coordenacao-privacidade-retencao--celular.png')
  })

  it('dá nome à página inicial, que não tem endereço', () => {
    expect(nomeDaFoto(baseDaFoto('aluno', '/', 'computador'))).toBe('aluno--inicio--computador.png')
  })

  it('numera os pedaços da página comprida', () => {
    expect(nomeDaFoto(baseDaFoto('professora', '/professor/turmas', 'celular'), 2)).toBe('professora--professor-turmas--celular-2.png')
  })

  it('leva o que foi clicado: duas abas do mesmo endereço não se apagam', () => {
    const aberta = baseDaFoto('coordenacao', '/coordenacao/privacidade', 'celular')
    const clicada = baseDaFoto('coordenacao', '/coordenacao/privacidade', 'celular', ['text=Empresas que recebem dados'])
    expect(clicada).toBe('coordenacao--coordenacao-privacidade--Empresas-que-recebem-dados--celular')
    expect(clicada).not.toBe(aberta)
  })

  it('marca a escola vazia: a tela vazia e a cheia têm o mesmo endereço e não se apagam', () => {
    expect(baseDaFoto('professora', '/professor/turmas', 'celular', [], true)).toBe('vazia--professora--professor-turmas--celular')
    expect(fotosAnteriores(['vazia--professora--professor-turmas--celular.png'], baseDaFoto('professora', '/professor/turmas', 'celular'))).toEqual([])
  })
})

describe('as fotos anteriores de uma tela', () => {
  const pasta = [
    'coordenacao--coordenacao-privacidade--celular.png',
    'coordenacao--coordenacao-privacidade--celular-1.png',
    'coordenacao--coordenacao-privacidade--celular-2.png',
    'coordenacao--coordenacao-privacidade--computador.png',
    'coordenacao--coordenacao-privacidade--Empresas--celular.png',
    'coordenacao--coordenacao-privacidade--celular-antiga.png',
    'sessao-coordenacao.json',
  ]

  it('são a inteira e os pedaços daquela base, e nada da outra tela, da outra aba nem da sessão', () => {
    expect(fotosAnteriores(pasta, 'coordenacao--coordenacao-privacidade--celular')).toEqual([
      'coordenacao--coordenacao-privacidade--celular.png',
      'coordenacao--coordenacao-privacidade--celular-1.png',
      'coordenacao--coordenacao-privacidade--celular-2.png',
    ])
  })
})

describe('os pedaços de uma página', () => {
  it('a página que cabe sai inteira, num pedaço só', () => {
    expect(pedacos(768, 1_600)).toEqual([{ y: 0, altura: 768 }])
    expect(pedacos(1_600, 1_600)).toEqual([{ y: 0, altura: 1_600 }])
  })

  it('a página comprida sai de cima para baixo, sem buraco nem sobreposição, e o último pedaço é o que sobra', () => {
    expect(pedacos(3_900, 1_600)).toEqual([
      { y: 0, altura: 1_600 },
      { y: 1_600, altura: 1_600 },
      { y: 3_200, altura: 700 },
    ])
  })

  it('a página sem altura medida ainda rende um pedaço, em vez de foto nenhuma', () => {
    expect(pedacos(0, 1_600)).toEqual([{ y: 0, altura: 1 }])
  })
})

describe('o papel pedido na foto', () => {
  it('aceita os três papéis da vitrine e recusa o resto', () => {
    expect(ehPapel('coordenacao')).toBe(true)
    expect(ehPapel('professora')).toBe(true)
    expect(ehPapel('aluno')).toBe(true)
    expect(ehPapel('operador')).toBe(false)
    expect(ehPapel(undefined)).toBe(false)
  })
})
