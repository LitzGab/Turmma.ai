import { ESLint, type Linter } from 'eslint'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { raizRepositorio } from '../ci/executar.ts'
import { criarEslintDasGuardas, violacoesDasGuardas } from './eslint-das-guardas.ts'
import { EXCECOES_DAS_GUARDAS, REGRAS_DAS_GUARDAS, REGRAS_DE_LOG, REGRAS_DE_SDK_DE_IA } from './index.mjs'
import { CHAVES_PESSOAIS, ehChaveOperacional, ehNomePessoal } from './regras-log.mjs'

// Cada fixture em __fixtures__ traz, na própria linha, a marca "reprova: <regra>". O teste passa
// a fixture pelo ESLint real do repositório, com um caminho simulado, e exige exatamente as
// marcas: nem guarda que deixa passar, nem guarda que acusa o jeito certo de logar.

const REGRA_DAS_DIRETIVAS = '@eslint-community/eslint-comments/no-restricted-disable'
const regrasObservadas = new Set<string>([...REGRAS_DAS_GUARDAS, REGRA_DAS_DIRETIVAS])

const eslint = new ESLint({ cwd: raizRepositorio })
const eslintDasGuardas = criarEslintDasGuardas()

function lerFixture(nome: string): string {
  return readFileSync(join(raizRepositorio, 'tools/guardas/__fixtures__', nome), 'utf8')
}

/** Marcas da fixture de violação, exigindo que existam: marca e regra apagadas juntas não passam. */
function marcasDeViolacao(fixture: string): string[] {
  const encontradas = marcas(lerFixture(fixture))
  expect(encontradas.length, `a fixture ${fixture} perdeu as marcas`).toBeGreaterThan(0)
  return encontradas
}

/** `"8 guardas/log-sem-dado-pessoal"`, uma entrada por marca, em ordem. */
function marcas(codigo: string): string[] {
  return codigo
    .split('\n')
    .flatMap((linha, indice) => {
      const marca = /reprova: ([^*]+?)\s*(?:\*\/)?$/.exec(linha)
      return marca?.[1] === undefined ? [] : marca[1].split(',').map((regra) => `${indice + 1} ${regra.trim()}`)
    })
    .sort()
}

async function lintar(motor: ESLint, fixture: string, caminhoSimulado: string): Promise<string[]> {
  const [resultado] = await motor.lintText(lerFixture(fixture), { filePath: join(raizRepositorio, caminhoSimulado) })
  if (resultado === undefined) throw new Error(`o ESLint não devolveu resultado para ${fixture}`)
  const fatais = resultado.messages.filter((mensagem: Linter.LintMessage) => mensagem.fatal === true)
  expect(fatais, `a fixture ${fixture} não compila`).toEqual([])
  return resultado.messages
    .filter((mensagem) => mensagem.ruleId !== null && regrasObservadas.has(mensagem.ruleId))
    .map((mensagem) => `${mensagem.line} ${mensagem.ruleId}`)
    .sort()
}

describe('guarda de log com dado pessoal', () => {
  it.each([
    'apps/api/src/sistema/correcao.service.ts',
    'apps/api/src/ia/adapters/openai.adapter.ts',
    'apps/api/test/correcao.int.test.ts',
    'apps/web/src/logica.ts',
    'packages/nucleo/src/fila/worker.ts',
    'tools/ci/etapa.ts',
  ])('reprova dado pessoal em qualquer nível e forma de expressão, objeto inteiro e toda forma de chamar o logger, em %s', async (caminho) => {
    expect(await lintar(eslint, 'log-dado-pessoal.ts', caminho)).toEqual(marcasDeViolacao('log-dado-pessoal.ts'))
  })

  it('reprova spread, template, concatenação, interpolação, JSON.stringify, função, mensagem variável e logger desestruturado', async () => {
    const obtidas = await lintar(eslint, 'log-conteudo-montado.ts', 'packages/nucleo/src/fila/despachante.ts')
    expect(obtidas).toEqual(marcasDeViolacao('log-conteudo-montado.ts'))
  })

  it('deixa passar o log com evento fixo, ids, durações, contagem de tokens e erro', async () => {
    expect(marcas(lerFixture('log-permitido.ts'))).toEqual([])
    expect(await lintar(eslint, 'log-permitido.ts', 'apps/api/src/sistema/correcao.service.ts')).toEqual([])
  })

  it.each([
    ['nome', true],
    ['nomeDoAluno', true],
    ['NOME_ALUNO', true],
    ['emailsDoResponsavel', true],
    ['conteudoDaMensagem', true],
    ['notaId', false],
    ['notaIds', false],
    ['promptTokens', false],
    ['respostaStatus', false],
    ['promptVersao', false],
    ['anotacao', false],
    ['evento', false],
    // Decisão: reprovam, mesmo sem ser de pessoa. O nome certo no log é `fila`, `escolaId`,
    // `promptVersao`; nota máxima é configuração, não vai para log.
    ['nomeDaFila', true],
    ['nomeDaEscola', true],
    ['versaoDoPrompt', true],
    ['notaMaxima', true],
  ])('%s é nome pessoal: %s', (nome, esperado) => {
    expect(ehNomePessoal(nome)).toBe(esperado)
  })

  it.each([
    ['evento', true],
    ['alunoId', true],
    ['duracaoMs', true],
    ['criadoEm', true],
    ['promptTokens', true],
    ['aluno', false],
    ['dados', false],
    ['detalhe', false],
    ['notaEm', false],
  ])('%s aceita valor calculado no log: %s', (chave, esperado) => {
    expect(ehChaveOperacional(chave)).toBe(esperado)
  })

  it('a guarda conhece as mesmas chaves que o redact do logger remove', async () => {
    // Import por variável: o tsconfig de tools não compila o código do núcleo, só o Vitest o carrega.
    const nucleo = '@educa/nucleo'
    const { CHAVES_PESSOAIS: chavesDoRedact } = (await import(nucleo)) as { CHAVES_PESSOAIS: readonly string[] }
    expect([...CHAVES_PESSOAIS].sort()).toEqual([...chavesDoRedact].sort())
  })
})

describe('guarda de SDK de provedor de IA', () => {
  it.each([
    'apps/api/src/sistema/modelo.ts',
    'apps/api/src/ia/porta.ts',
    'apps/api/src/ia/adapters.ts',
    'apps/web/src/modelo.ts',
    'packages/nucleo/src/modelo.ts',
  ])('reprova import, alias, subcaminho, export, require, import() e typeof import() em %s', async (caminho) => {
    expect(await lintar(eslint, 'sdk-de-ia.ts', caminho)).toEqual(marcasDeViolacao('sdk-de-ia.ts'))
  })

  it.each(['apps/api/src/ia/adapters/openai.adapter.ts', 'apps/api/src/ia/adapters/google/cliente.ts'])(
    'deixa o mesmo código passar dentro dos adaptadores: %s',
    async (caminho) => {
      expect(await lintar(eslint, 'sdk-de-ia.ts', caminho)).toEqual([])
    },
  )
})

describe('guarda desligada por comentário', () => {
  it.each(['desabilitar-na-linha.ts', 'desabilitar-tudo.ts'])(
    'o ESLint reprova a diretiva que desliga uma guarda: %s',
    async (fixture) => {
      expect(await lintar(eslint, fixture, 'apps/api/src/sistema/x.ts')).toEqual(marcasDeViolacao(fixture))
    },
  )

  it.each([
    ['desabilitar-na-linha.ts', ['7 guardas/log-sem-dado-pessoal', '8 guardas/log-sem-dado-pessoal', '10 @typescript-eslint/no-restricted-imports']],
    ['desabilitar-tudo.ts', ['6 guardas/log-sem-dado-pessoal']],
    ['desabilitar-a-propria-vigia.ts', ['7 guardas/log-sem-dado-pessoal']],
    ['configurar-por-comentario.ts', ['7 guardas/log-sem-dado-pessoal']],
  ])('a passada sem comentários do npm run lint ainda pega a violação: %s', async (fixture, esperadas) => {
    expect(await lintar(eslintDasGuardas, fixture, 'apps/api/src/sistema/x.ts')).toEqual([...esperadas].sort())
  })

  it.each([
    ['desabilitar-a-propria-vigia.ts', 1],
    ['configurar-por-comentario.ts', 1],
    ['log-permitido.ts', 0],
  ])('o script da passada sem comentários sai com código de falha quando há violação: %s', (fixture, codigoEsperado) => {
    const resultado = spawnSync(process.execPath, ['tools/guardas/lint.ts', '--texto', 'apps/api/src/sistema/x.ts'], {
      cwd: raizRepositorio,
      input: lerFixture(fixture),
      encoding: 'utf8',
    })
    expect(resultado.status, resultado.stdout + resultado.stderr).toBe(codigoEsperado)
    if (codigoEsperado === 1) expect(resultado.stdout).toContain('guardas/log-sem-dado-pessoal')
  })

  it('o relatório da passada só conta violação de guarda, não aviso de diretiva ignorada nem outra regra', () => {
    const mensagem = (ruleId: string | null): Linter.LintMessage => ({ ruleId, message: 'x', line: 1, column: 1, severity: 2 })
    const resultado = {
      filePath: 'x.ts',
      messages: [mensagem(null), mensagem('no-console'), mensagem('guardas/log-sem-dado-pessoal')],
      suppressedMessages: [],
      errorCount: 3,
      fatalErrorCount: 0,
      warningCount: 0,
      fixableErrorCount: 0,
      fixableWarningCount: 0,
      usedDeprecatedRules: [],
    } satisfies ESLint.LintResult
    const limpo = { ...resultado, messages: [mensagem('no-console')] }
    const violacoes = violacoesDasGuardas([resultado, limpo])
    expect(violacoes).toHaveLength(1)
    expect(violacoes[0]?.messages.map((item) => item.ruleId)).toEqual(['guardas/log-sem-dado-pessoal'])
  })

  it('npm run lint roda a passada sem comentários depois do ESLint, e falha se qualquer uma falhar', () => {
    const { scripts } = JSON.parse(readFileSync(join(raizRepositorio, 'package.json'), 'utf8')) as { scripts: Record<string, string> }
    expect(scripts['lint']).toBe('eslint . --max-warnings=0 && node tools/guardas/lint.ts')
  })
})

describe('configuração das guardas', () => {
  it('as únicas exceções são o SDK nos adaptadores, o teste do redact e a mensagem repassada pelo LoggerDoNest', () => {
    expect(EXCECOES_DAS_GUARDAS).toEqual([
      { files: ['apps/api/src/ia/adapters/**'], regras: REGRAS_DE_SDK_DE_IA },
      { files: ['packages/nucleo/src/log/logger.test.ts'], regras: REGRAS_DE_LOG },
      { files: ['packages/nucleo/src/log/logger-do-nest.ts'], regras: ['guardas/log-sem-conteudo-montado'] },
    ])
  })

  /** Arquivos versionados ou prestes a ser, sem os ignorados pelo git. */
  function arquivosDoRepositorio(): string[] {
    const resultado = spawnSync('git', ['ls-files', '--cached', '--others', '--exclude-standard'], { cwd: raizRepositorio, encoding: 'utf8' })
    expect(resultado.status).toBe(0)
    return resultado.stdout.split('\n').filter(Boolean)
  }

  it('não existe eslint.config fora da raiz: numa subpasta ele substituiria a configuração e as guardas', () => {
    const configuracoes = arquivosDoRepositorio().filter((arquivo) => /(?:^|\/)eslint\.config\.[cm]?[jt]s$/.test(arquivo))
    expect(configuracoes).toEqual(['eslint.config.mjs'])
  })

  it('nenhum código versionado fica fora do lint, exceto as fixtures de violação', async () => {
    const codigo = arquivosDoRepositorio().filter(
      (arquivo) => /\.(?:[cm]?[jt]s|[jt]sx)$/.test(arquivo) && !arquivo.startsWith('tools/guardas/__fixtures__/'),
    )
    expect(codigo.length).toBeGreaterThan(20)
    const ignorados: string[] = []
    for (const arquivo of codigo) {
      if (await eslint.isPathIgnored(join(raizRepositorio, arquivo))) ignorados.push(arquivo)
    }
    expect(ignorados).toEqual([])
  })

  it.each([
    'apps/api/src/main.ts',
    'apps/api/src/sistema/saude.controller.ts',
    'apps/web/src/Saude.tsx',
    'packages/nucleo/src/log/logger.ts',
    'packages/shared/src/index.ts',
    'tools/ci/verificar.ts',
    'eslint.config.mjs',
  ])('todas as guardas e a vigia de diretiva ficam ligadas como erro em %s', async (caminho) => {
    const configuracao = (await eslint.calculateConfigForFile(join(raizRepositorio, caminho))) as {
      rules: Record<string, [number, ...unknown[]]>
    }
    for (const regra of [...REGRAS_DAS_GUARDAS, REGRA_DAS_DIRETIVAS]) {
      expect(configuracao.rules[regra]?.[0], `${regra} em ${caminho}`).toBe(2)
    }
  })
})
