import { describe, expect, it } from 'vitest'
import { baseDaFoto, ehPapel, fotosAnteriores, fotosDaTela, linhasDoResultado, nomeDaFoto, pedacos, relatorioDeRolagem, rolaNaJanela, type Foto } from './foto.ts'

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

  it('marca o aparelho escuro: a foto no escuro e a no claro da mesma tela não se apagam', () => {
    expect(baseDaFoto('aluno', '/aluno/atividades', 'computador', [], false, true)).toBe('escuro--aluno--aluno-atividades--computador')
    expect(baseDaFoto('aluno', '/aluno/atividades', 'computador', [], true, true)).toBe('escuro--vazia--aluno--aluno-atividades--computador')
    expect(fotosAnteriores(['escuro--aluno--aluno-atividades--computador.png'], baseDaFoto('aluno', '/aluno/atividades', 'computador'))).toEqual([])
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

describe('a rolagem a 1366 × 768', () => {
  const foto = (caminho: string, tela: 'computador' | 'celular', alturaDaPagina: number, arquivo = `${caminho.slice(1)}--${tela}.png`, cliques: readonly string[] = []): Foto => ({
    caminho,
    tela,
    arquivo,
    parouEm: caminho,
    alturaDaPagina,
    cliques,
  })

  it('a página rola quando a altura passa da janela do computador, e só então', () => {
    expect(rolaNaJanela(768)).toBe(false)
    expect(rolaNaJanela(769)).toBe(true)
    expect(rolaNaJanela(800)).toBe(true)
    expect(rolaNaJanela(500)).toBe(false)
  })

  it('o relatório lista a tela do computador que rola, uma vez, mesmo em pedaços, e não a do celular', () => {
    const fotos = [
      foto('/coordenacao/alunos', 'computador', 2_400, 'a-1.png'),
      foto('/coordenacao/alunos', 'computador', 2_400, 'a-2.png'),
      foto('/coordenacao/alunos', 'celular', 3_900),
      foto('/coordenacao/inicio', 'computador', 768),
      foto('/coordenacao/inicio', 'celular', 1_900),
      foto('/coordenacao/turmas', 'computador', 900),
    ]
    const linhas = relatorioDeRolagem(fotos, false)
    expect(linhas).toContain('  /coordenacao/alunos: 2400 px')
    expect(linhas).toContain('  /coordenacao/turmas: 900 px')
    expect(linhas.join('\n')).not.toContain('/coordenacao/inicio')
    expect(linhas.join('\n')).not.toContain('3900')
    expect(linhas.filter((linha) => linha.includes('/coordenacao/alunos'))).toHaveLength(1)
  })

  it('quando nenhuma tela rola, o relatório diz que mediu e que nenhuma rola', () => {
    const linhas = relatorioDeRolagem([foto('/aluno/inicio', 'computador', 768), foto('/aluno/inicio', 'celular', 2_000)], false)
    expect(linhas).toHaveLength(1)
    expect(linhas[0]).toMatch(/Nenhuma tela rola a 1366 × 768/)
  })

  it('sem foto nenhuma, não há o que dizer', () => {
    expect(relatorioDeRolagem([], false)).toEqual([])
  })

  it('o relatório diz a aba clicada e a escola vazia', () => {
    const com = relatorioDeRolagem([foto('/professor/turmas', 'computador', 1_000, 'x.png', ['text=Alunos'])], true)
    expect(com.join('\n')).toContain('depois de clicar text=Alunos')
    expect(com.join('\n')).toContain('escola vazia')
    const sem = relatorioDeRolagem([foto('/professor/turmas', 'computador', 1_000)], false)
    expect(sem.join('\n')).not.toContain('depois de clicar')
    expect(sem.join('\n')).not.toContain('escola vazia')
  })

  it('cada foto da tela leva a altura medida e os cliques da chamada, na foto em pedaços e na inteira', () => {
    const tela = { caminho: '/coordenacao/alunos', tela: 'computador', parouEm: '/coordenacao/alunos', alturaDaPagina: 2_400, cliques: ['text=Alunos'] }
    const emPedacos = fotosDaTela(tela, ['a-1.png', 'a-2.png'])
    expect(emPedacos.map((foto) => foto.arquivo)).toEqual(['a-1.png', 'a-2.png'])
    expect(emPedacos.map((foto) => foto.alturaDaPagina)).toEqual([2_400, 2_400])
    expect(emPedacos.map((foto) => foto.cliques)).toEqual([['text=Alunos'], ['text=Alunos']])
    const inteira = fotosDaTela({ ...tela, alturaDaPagina: 1_000, cliques: [] }, ['a.png'])
    expect(inteira).toEqual([{ caminho: '/coordenacao/alunos', tela: 'computador', parouEm: '/coordenacao/alunos', alturaDaPagina: 1_000, cliques: [], arquivo: 'a.png' }])
    // O que o relatório mostra é o que foi medido, não outra altura qualquer.
    expect(relatorioDeRolagem(emPedacos, false)).toContain('  /coordenacao/alunos, depois de clicar text=Alunos: 2400 px')
  })

  it('o resultado do comando traz os arquivos, o aviso de redirecionamento e depois o relatório', () => {
    const fotos: Foto[] = [
      { ...foto('/coordenacao/alunos', 'computador', 1_000, '/x/a.png') },
      { ...foto('/coordenacao/turmas', 'computador', 700, '/x/b.png'), parouEm: '/entrar' },
    ]
    const linhas = linhasDoResultado(fotos, 'http://localhost:5173', true)
    expect(linhas[0]).toBe('/x/a.png')
    expect(linhas[1]).toBe('/x/b.png   (a página parou em /entrar)')
    expect(linhas.slice(2).join('\n')).toContain('/coordenacao/alunos')
    expect(linhas.slice(2).join('\n')).toContain('escola vazia')
  })
})
