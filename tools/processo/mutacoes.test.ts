import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  aplicarMutacao,
  avaliarMutacoes,
  comandoDoTeste,
  conferirMutacoes,
  impressaoDasMutacoes,
  lerMutacoes,
  pedeReconstrucao,
  tipoDoTeste,
  type Mutacao,
} from './mutacoes.ts'

const CERCA = '```'

function bloco(...linhas: string[]): string {
  return [`${CERCA}mutacao`, ...linhas, CERCA].join('\n')
}

const REPOSITORIO = `export function acharPedido(escolaId: string, id: string) {
  return db
    .select()
    .from(pedidos)
    .where(and(
      eq(pedidos.escolaId, escolaId),
      eq(pedidos.id, id),
    ))
}

export function listarPedidos(escolaId: string) {
  return db.select().from(pedidos).where(and(
      eq(pedidos.escolaId, escolaId),
  ))
}
`

const DOCUMENTO = `# Tarefa 3.0

## Mutações

A cláusula de escopo de cada consulta.

${bloco(
  'arquivo: apps/api/src/pedidos.repository.ts',
  'teste: apps/api/test/pedidos.int.test.ts › a coordenação de outra escola não acha o pedido',
  '-   eq(pedidos.escolaId, escolaId),',
  '    eq(pedidos.id, id),',
)}

${bloco('arquivo: apps/web/src/Pedidos.tsx', 'teste: apps/web/src/Pedidos.test.tsx', '- if (pedidos.length === 0)', '+ if (false)')}

## Revisões
`

function mutacao(parcial: Partial<Mutacao> = {}): Mutacao {
  return { arquivo: 'apps/api/src/pedidos.repository.ts', teste: 'apps/api/test/pedidos.int.test.ts', caso: null, antes: ['eq(pedidos.escolaId, escolaId),', 'eq(pedidos.id, id),'], depois: ['eq(pedidos.id, id),'], ...parcial }
}

describe('ler os blocos de mutação do documento', () => {
  it('tira de cada bloco o arquivo, o teste com o caso, o trecho de hoje e o que fica; contexto entra nos dois lados', () => {
    const { mutacoes, erros } = lerMutacoes(DOCUMENTO)
    expect(erros).toEqual([])
    expect(mutacoes).toEqual([
      {
        arquivo: 'apps/api/src/pedidos.repository.ts',
        teste: 'apps/api/test/pedidos.int.test.ts',
        caso: 'a coordenação de outra escola não acha o pedido',
        antes: ['eq(pedidos.escolaId, escolaId),', 'eq(pedidos.id, id),'],
        depois: ['eq(pedidos.id, id),'],
      },
      { arquivo: 'apps/web/src/Pedidos.tsx', teste: 'apps/web/src/Pedidos.test.tsx', caso: null, antes: ['if (pedidos.length === 0)'], depois: ['if (false)'] },
    ])
  })

  it('bloco que não dá para conferir vira erro com o número dele, e não some', () => {
    const { mutacoes, erros } = lerMutacoes(
      [
        bloco('teste: a.test.ts', '- x'),
        bloco('arquivo: a.ts', '- x'),
        bloco('arquivo: a.ts', 'teste: a.test.ts', '  só contexto'),
        bloco('arquivo: a.ts', 'teste: a.test.ts', 'linha sem marca'),
        bloco('arquivo: a.ts', 'teste: a.test.ts', '- igual', '+ igual'),
        bloco('arquivo: a.ts', 'teste: a.test.ts', '- some'),
      ].join('\n\n'),
    )
    expect(mutacoes).toHaveLength(1)
    expect(erros).toEqual([
      'mutação 1: falta a linha "arquivo:"',
      'mutação 2: falta a linha "teste:"',
      'mutação 3: nenhuma linha começa com "-": a mutação precisa tirar ou trocar um trecho que existe',
      'mutação 4: linha "linha sem marca" não começa com "-", "+" nem espaço',
      'mutação 5: o que entra é igual ao que sai',
    ])
  })

  it('documento sem bloco não tem mutação nem erro', () => {
    expect(lerMutacoes('## Mutações\n\n`a.ts` › função › cláusula → teste vermelho\n')).toEqual({ mutacoes: [], erros: [] })
  })
})

describe('aplicar a mutação ao arquivo', () => {
  it('tira a linha marcada e mantém o contexto, sem depender do recuo', () => {
    const resultado = aplicarMutacao(REPOSITORIO, mutacao())
    expect('mutado' in resultado && resultado.mutado).toBe(REPOSITORIO.replace('      eq(pedidos.escolaId, escolaId),\n      eq(pedidos.id, id),', '      eq(pedidos.id, id),'))
  })

  it('troca o trecho pelo que entra, no recuo do que saiu', () => {
    const resultado = aplicarMutacao('function f() {\n  if (a && b) {\n    return 1\n  }\n}\n', mutacao({ antes: ['if (a && b) {'], depois: ['if (a) {'] }))
    expect('mutado' in resultado && resultado.mutado).toBe('function f() {\n  if (a) {\n    return 1\n  }\n}\n')
  })

  it('recusa o trecho que não está mais no arquivo: a linha ficou velha', () => {
    const resultado = aplicarMutacao(REPOSITORIO, mutacao({ antes: ['eq(pedidos.turmaId, turmaId),'], depois: [] }))
    expect('recusa' in resultado && resultado.recusa).toMatch(/o trecho não está em apps\/api\/src\/pedidos\.repository\.ts/)
  })

  it('recusa o trecho que aparece duas vezes, e o contexto é o que desempata', () => {
    const ambigua = aplicarMutacao(REPOSITORIO, mutacao({ antes: ['eq(pedidos.escolaId, escolaId),'], depois: [] }))
    expect('recusa' in ambigua && ambigua.recusa).toMatch(/aparece 2 vezes.*linhas de contexto/)
    expect('mutado' in aplicarMutacao(REPOSITORIO, mutacao())).toBe(true)
  })
})

describe('o comando que roda o teste de uma mutação', () => {
  it('escolhe o projeto pelo caminho do teste', () => {
    expect(tipoDoTeste('apps/api/src/x.test.ts')).toBe('unidade')
    expect(tipoDoTeste('apps/web/src/Tela.test.tsx')).toBe('unidade')
    expect(tipoDoTeste('apps/api/test/x.int.test.ts')).toBe('integracao')
    expect(tipoDoTeste('infra/test/metricas.int.test.ts')).toBe('infra')
    expect(tipoDoTeste('e2e/areas.spec.ts')).toBe('e2e')
    expect(tipoDoTeste('docs/lgpd.md')).toBeNull()
  })

  it('unidade e integração rodam o arquivo no projeto dele, com o caso quando há', () => {
    expect(comandoDoTeste(mutacao({ caso: 'outra escola' }))).toEqual(['npx', 'vitest', 'run', '--project', 'integracao', 'apps/api/test/pedidos.int.test.ts', '-t', 'outra escola'])
    expect(comandoDoTeste(mutacao({ teste: 'apps/web/src/Tela.test.tsx' }))).toEqual(['npx', 'vitest', 'run', '--project', 'unidade', 'apps/web/src/Tela.test.tsx'])
    expect(comandoDoTeste(mutacao({ teste: 'README.md' }))).toBeNull()
  })

  it('mutação de fonte provada por e2e reconstrói a web; a de fixture do próprio e2e, não; e roda um projeto só', () => {
    const deTela = mutacao({ arquivo: 'apps/web/src/Tela.tsx', teste: 'e2e/areas.spec.ts', caso: 'o aluno acha' })
    expect(pedeReconstrucao(deTela)).toBe(true)
    expect(comandoDoTeste(deTela)).toEqual(['node', 'tools/ci/e2e.ts', '--manter-ambiente', 'e2e/areas.spec.ts', '--grep=o aluno acha', '--project=chromebook'])
    const deFixture = mutacao({ arquivo: 'e2e/__fixtures__/sessao.ts', teste: 'e2e/areas.spec.ts' })
    expect(pedeReconstrucao(deFixture)).toBe(false)
    expect(comandoDoTeste(deFixture)).toEqual(['npx', 'playwright', 'test', 'e2e/areas.spec.ts', '--project=chromebook'])
  })
})

describe('conferir as mutações: o teste tem de cair sem a cláusula, e o arquivo volta ao que era', () => {
  function arvore(): string {
    const raiz = mkdtempSync(join(tmpdir(), 'mutacoes-'))
    for (const [arquivo, conteudo] of Object.entries({ 'apps/api/src/pedidos.repository.ts': REPOSITORIO, 'apps/api/test/pedidos.int.test.ts': '// teste\n' })) {
      mkdirSync(dirname(join(raiz, arquivo)), { recursive: true })
      writeFileSync(join(raiz, arquivo), conteudo)
    }
    return raiz
  }
  const fonte = (raiz: string) => readFileSync(join(raiz, 'apps/api/src/pedidos.repository.ts'), 'utf8')

  it('vermelho com a cláusula fora é o que passa, e o teste vê o arquivo mutado', () => {
    const raiz = arvore()
    const vistos: boolean[] = []
    const resultados = conferirMutacoes(raiz, [mutacao()], () => {
      const mutado = !fonte(raiz).includes('.where(and(\n      eq(pedidos.escolaId, escolaId),\n      eq(pedidos.id, id),')
      vistos.push(mutado)
      return !mutado
    })
    expect(resultados.map((resultado) => resultado.veredito)).toEqual(['vermelho'])
    // Uma corrida limpa antes, uma mutada depois.
    expect(vistos).toEqual([false, true])
    expect(fonte(raiz)).toBe(REPOSITORIO)
  })

  it('teste que continua verde sem a cláusula reprova: falta o teste que a prove', () => {
    const raiz = arvore()
    const avisos: string[] = []
    const resultados = conferirMutacoes(raiz, [mutacao()], () => true, (texto) => avisos.push(texto))
    expect(resultados[0]).toMatchObject({ veredito: 'verde' })
    expect(avisos.join('')).toContain('continuou verde sem a cláusula')
    expect(fonte(raiz)).toBe(REPOSITORIO)
  })

  it('teste que já não passa limpo é recusado sem mutar nada: vermelho de antes não prova cláusula nenhuma', () => {
    const raiz = arvore()
    let corridas = 0
    const resultados = conferirMutacoes(raiz, [mutacao(), mutacao({ caso: null })], () => {
      corridas += 1
      return false
    })
    expect(resultados.map((resultado) => resultado.veredito)).toEqual(['recusada', 'recusada'])
    expect(resultados[0]?.motivo).toMatch(/não passa sem a mutação/)
    // A corrida limpa do mesmo teste e caso vale para as duas mutações.
    expect(corridas).toBe(1)
  })

  it('recusa arquivo e teste que não existem, e trecho que não está mais lá, sem rodar teste', () => {
    const raiz = arvore()
    let corridas = 0
    const resultados = conferirMutacoes(
      raiz,
      [mutacao({ arquivo: 'apps/api/src/nao-existe.ts' }), mutacao({ teste: 'apps/api/test/nao-existe.int.test.ts' }), mutacao({ antes: ['eq(pedidos.turmaId, turmaId),'], depois: [] })],
      () => {
        corridas += 1
        return true
      },
    )
    expect(resultados.map((resultado) => resultado.veredito)).toEqual(['recusada', 'recusada', 'recusada'])
    expect(corridas).toBe(0)
  })

  it('restaura o arquivo mesmo quando a corrida do teste estoura', () => {
    const raiz = arvore()
    let corridas = 0
    expect(() =>
      conferirMutacoes(raiz, [mutacao()], () => {
        corridas += 1
        if (corridas === 2) throw new Error('o processo do teste morreu')
        return true
      }),
    ).toThrow(/morreu/)
    expect(fonte(raiz)).toBe(REPOSITORIO)
  })
})

describe('o carimbo vale para as mutações como estão escritas agora', () => {
  const documento = 'tasks/prd-x/3_task.md'
  const { mutacoes } = lerMutacoes(DOCUMENTO)
  const carimbo = { mutacoes: { documento, impressao: impressaoDasMutacoes(mutacoes), total: mutacoes.length } }

  it('conferidas pelo último portão, passa; e mexer no texto em volta dos blocos não invalida', () => {
    expect(avaliarMutacoes(carimbo, documento, DOCUMENTO)).toBeNull()
    expect(avaliarMutacoes(carimbo, documento, DOCUMENTO.replace('A cláusula de escopo de cada consulta.', 'Outra frase.'))).toBeNull()
  })

  it('bloco novo, trecho trocado ou teste trocado depois do portão bloqueia, com o comando a rodar', () => {
    const comOutroTrecho = DOCUMENTO.replace('- if (pedidos.length === 0)', '- if (pedidos.length < 1)')
    const comOutroTeste = DOCUMENTO.replace('teste: apps/web/src/Pedidos.test.tsx', 'teste: apps/web/src/Outro.test.tsx')
    const comMaisUm = `${DOCUMENTO}\n${bloco('arquivo: a.ts', 'teste: a.test.ts', '- x')}\n`
    for (const conteudo of [comOutroTrecho, comOutroTeste, comMaisUm]) {
      expect(avaliarMutacoes(carimbo, documento, conteudo)).toMatch(/mudou depois do último portão\. Rode `node tools\/processo\/portao-local\.ts --tarefa tasks\/prd-x\/3_task\.md` de novo/)
    }
  })

  it('portão que não conferiu este documento, ou não conferiu mutação nenhuma, bloqueia', () => {
    expect(avaliarMutacoes(null, documento, DOCUMENTO)).toMatch(/as 2 mutações de tasks\/prd-x\/3_task\.md não foram conferidas/)
    expect(avaliarMutacoes({}, documento, DOCUMENTO)).toMatch(/não foram conferidas/)
    expect(avaliarMutacoes({ mutacoes: { ...carimbo.mutacoes, documento: 'tasks/prd-x/4_task.md' } }, documento, DOCUMENTO)).toMatch(/não foram conferidas/)
  })

  it('bloco malformado bloqueia mesmo com carimbo, e documento sem bloco não é cobrado', () => {
    expect(avaliarMutacoes(carimbo, documento, `${DOCUMENTO}\n${bloco('arquivo: a.ts', '- x')}\n`)).toMatch(/mutação 3: falta a linha "teste:"/)
    expect(avaliarMutacoes(null, documento, '## Mutações\n\nnenhuma cláusula nova\n')).toBeNull()
  })
})
