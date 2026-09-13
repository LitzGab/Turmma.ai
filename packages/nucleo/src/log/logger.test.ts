import pg from 'pg'
import { describe, expect, it } from 'vitest'
import { executarNoContexto } from '../contexto/contexto.js'
import { criarLogger, LoggerDoNest, TEXTO_OMITIDO_POR_PROFUNDIDADE, TEXTO_REMOVIDO, tratadorDeErroDoProcesso } from './logger.js'

function erroDeUnicidade(): pg.DatabaseError {
  const erro = new pg.DatabaseError('duplicate key value violates unique constraint "aluno_nome_key"', 0, 'error')
  return Object.assign(erro, {
    severity: 'ERROR',
    code: '23505',
    constraint: 'aluno_nome_key',
    detail: 'Key (nome)=(Enzo Martins) already exists.',
  })
}

function loggerCapturado() {
  const linhas: string[] = []
  const logger = criarLogger({ servico: 'teste', nivel: 'trace', destino: { write: (linha: string) => linhas.push(linha) } })
  const registros = () => linhas.map((linha) => JSON.parse(linha) as Record<string, unknown>)
  return { logger, linhas, registros }
}

describe('criarLogger', () => {
  it('remove nome de aluno aninhado, nota aninhada e authorization, mantendo os ids', () => {
    const { logger, linhas, registros } = loggerCapturado()
    logger.info({
      aluno: { id: 'a1', nome: 'Enzo Martins', matricula: '2026001' },
      correcao: { avaliacaoId: 'v1', nota: 7.5, resposta: 'letra C' },
      authorization: 'Bearer segredo-sintetico',
    })
    const [registro] = registros()
    expect(registro).toMatchObject({
      aluno: { id: 'a1', nome: TEXTO_REMOVIDO, matricula: TEXTO_REMOVIDO },
      correcao: { avaliacaoId: 'v1', nota: TEXTO_REMOVIDO, resposta: TEXTO_REMOVIDO },
      authorization: TEXTO_REMOVIDO,
    })
    const bruto = linhas.join('')
    for (const valor of ['Enzo Martins', '2026001', '7.5', 'letra C', 'segredo-sintetico']) {
      expect(bruto).not.toContain(valor)
    }
  })

  it.each(['nome', 'matricula', 'email', 'senha', 'resposta', 'nota', 'conversa', 'prompt'])(
    'remove a chave pessoal "%s" no primeiro nível e até dois níveis abaixo',
    (chave) => {
      const { logger, linhas } = loggerCapturado()
      logger.info({ [chave]: 'valor-pessoal-1', item: { [chave]: 'valor-pessoal-2', sub: { [chave]: 'valor-pessoal-3' } } })
      expect(linhas.join('')).not.toContain('valor-pessoal')
    },
  )

  it('remove authorization e cookie dentro de headers de requisição', () => {
    const { logger, linhas } = loggerCapturado()
    logger.info({ req: { headers: { authorization: 'Bearer abc-sintetico', cookie: 'sessao=xyz-sintetico' } } })
    logger.info({ headers: { cookie: 'sessao=qwe-sintetico' } })
    const bruto = linhas.join('')
    expect(bruto).not.toContain('sintetico')
  })

  it('põe requisicaoId, escolaId e usuarioId do contexto em toda linha, e nada fora de uma requisição', () => {
    const { logger, registros } = loggerCapturado()
    logger.info('boot')
    executarNoContexto({ requisicaoId: 'r-1', escolaId: 'e-1', usuarioId: 'u-1' }, () => {
      logger.warn({ evento: 'teste' })
    })
    const [boot, dentro] = registros()
    expect(boot).not.toHaveProperty('requisicaoId')
    expect(dentro).toMatchObject({ requisicaoId: 'r-1', escolaId: 'e-1', usuarioId: 'u-1', servico: 'teste', level: 'warn' })
  })

  it('loga erro do Postgres só com SQLSTATE e constraint, sem mensagem nem detail', () => {
    const { logger, linhas, registros } = loggerCapturado()
    const erro = erroDeUnicidade()
    logger.error({ err: erro })
    logger.error(erro)
    logger.warn({ evento: 'falha', causa: erro })
    const resumo = { tipo: 'ErroDoPostgres', sqlstate: '23505', constraint: 'aluno_nome_key' }
    const [comErr, direto, comOutraChave] = registros()
    expect(comErr).toMatchObject({ err: resumo })
    expect(direto).toMatchObject({ erro: resumo })
    expect(comOutraChave).toMatchObject({ causa: resumo })
    for (const [indice] of linhas.entries()) {
      expect(registros()[indice]).not.toHaveProperty('msg')
    }
    expect(linhas.join('')).not.toContain('Enzo Martins')
    expect(linhas.join('')).not.toContain('duplicate key')
  })

  it('resume erro do Postgres em qualquer nível de objeto ou lista, sem detail nem valor', () => {
    const { logger, linhas, registros } = loggerCapturado()
    const erro = erroDeUnicidade()
    logger.error({ contexto: { erro } })
    logger.error({ lista: [erro], a: { b: { c: { d: { erro } } } } })
    const resumo = { tipo: 'ErroDoPostgres', sqlstate: '23505' }
    const [aninhado, emLista] = registros()
    expect(aninhado).toMatchObject({ contexto: { erro: resumo } })
    expect(emLista).toMatchObject({ lista: [resumo], a: { b: { c: { d: { erro: resumo } } } } })
    const bruto = linhas.join('')
    expect(bruto).not.toContain('Enzo Martins')
    expect(bruto).not.toContain('detail')
  })

  it('corta objeto fundo demais e ciclo, em vez de serializá-los', () => {
    const { logger, linhas, registros } = loggerCapturado()
    const ciclico: Record<string, unknown> = { id: 'x' }
    ciclico.eu = ciclico
    const fundo = { n1: { n2: { n3: { n4: { n5: { n6: { erro: erroDeUnicidade() } } } } } } }
    logger.info({ ciclico, fundo })
    const registro = registros()[0] as { ciclico: { eu: unknown }; fundo: { n1: { n2: { n3: { n4: { n5: unknown } } } } } }
    expect(registro.ciclico.eu).toBe('[ciclo]')
    expect(registro.fundo.n1.n2.n3.n4.n5).toBe(TEXTO_OMITIDO_POR_PROFUNDIDADE)
    expect(linhas.join('')).not.toContain('Enzo Martins')
  })

  it('loga erro comum com tipo e pilha, sem a mensagem', () => {
    const { logger, linhas, registros } = loggerCapturado()
    logger.error({ erro: new SyntaxError('Unexpected token, "Enzo Martins" is not valid JSON') })
    const registro = registros()[0] as { erro: { tipo: string; pilha: string[] } }
    expect(registro.erro.tipo).toBe('SyntaxError')
    expect(registro.erro.pilha.length).toBeGreaterThan(0)
    expect(linhas.join('')).not.toContain('Enzo Martins')
  })
})

describe('LoggerDoNest', () => {
  it('escreve o log interno do Nest em JSON, com a origem e sem a pilha que repete a mensagem', () => {
    const { logger, linhas, registros } = loggerCapturado()
    const nest = new LoggerDoNest(logger)
    nest.log('Nest application successfully started', 'NestApplication')
    nest.error('falhou com Enzo Martins', 'Error: falhou com Enzo Martins\n    at algum-lugar.js:1:1', 'ExceptionsHandler')
    nest.error('sem origem', 'Error: Enzo Martins\n    at algum-lugar.js:1:1')
    nest.warn({ aluno: { nome: 'Enzo Martins' } }, 'banco')

    const [inicio, erro, semOrigem, objeto] = registros()
    expect(inicio).toMatchObject({ level: 'info', origem: 'NestApplication', msg: 'Nest application successfully started' })
    expect(erro).toMatchObject({ level: 'error', origem: 'ExceptionsHandler' })
    expect(semOrigem).not.toHaveProperty('origem')
    expect(objeto).toMatchObject({ level: 'warn', origem: 'banco', dados: { aluno: { nome: TEXTO_REMOVIDO } } })
    // A mensagem string do Nest continua saindo; o que não pode sair é a pilha nem objeto com nome.
    expect(linhas.slice(2).join('')).not.toContain('Enzo Martins')
    expect(linhas[1]).not.toContain('algum-lugar')
  })

  it('não rebaixa erro do Postgres para dentro de `dados` sem resumir', () => {
    const { logger, linhas, registros } = loggerCapturado()
    const nest = new LoggerDoNest(logger)
    nest.error({ erro: erroDeUnicidade() }, 'banco')
    nest.error(erroDeUnicidade(), 'banco')
    expect(registros()[0]).toMatchObject({ origem: 'banco', dados: { erro: { tipo: 'ErroDoPostgres', sqlstate: '23505' } } })
    expect(registros()[1]).toMatchObject({ origem: 'banco', erro: { tipo: 'ErroDoPostgres', sqlstate: '23505' } })
    expect(linhas.join('')).not.toContain('Enzo Martins')
    expect(linhas.join('')).not.toContain('duplicate key')
  })
})

describe('tratadorDeErroDoProcesso', () => {
  it('registra a rejeição não tratada em JSON, só com o resumo do erro, e encerra com código diferente de zero', () => {
    const { logger, linhas, registros } = loggerCapturado()
    const codigos: number[] = []
    tratadorDeErroDoProcesso(logger, 'processo.rejeicao_nao_tratada', (codigo) => codigos.push(codigo))(erroDeUnicidade())
    expect(registros()[0]).toMatchObject({
      level: 'fatal',
      evento: 'processo.rejeicao_nao_tratada',
      erro: { tipo: 'ErroDoPostgres', sqlstate: '23505' },
    })
    expect(linhas.join('')).not.toContain('Enzo Martins')
    expect(codigos).toEqual([1])
  })
})
