import { ESLint, type Linter } from 'eslint'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join, matchesGlob } from 'node:path'
import { describe, expect, it } from 'vitest'
import { raizRepositorio } from '../ci/executar.ts'
import { criarEslintDasGuardas, violacoesDasGuardas } from './eslint-das-guardas.ts'
import { EXCECOES_DAS_GUARDAS, REGRAS_DAS_GUARDAS, REGRAS_DE_LOG, REGRAS_DE_SDK_DE_IA, REGRAS_DE_TESTE, REGRAS_EM_TODO_ARQUIVO } from './index.mjs'
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

/** As mensagens das `regras` (por padrão, as das guardas e a das diretivas) que o ESLint deu na fixture, no caminho simulado. */
async function lintar(motor: ESLint, fixture: string, caminhoSimulado: string, regras: ReadonlySet<string> = regrasObservadas): Promise<string[]> {
  const [resultado] = await motor.lintText(lerFixture(fixture), { filePath: join(raizRepositorio, caminhoSimulado) })
  if (resultado === undefined) throw new Error(`o ESLint não devolveu resultado para ${fixture}`)
  const fatais = resultado.messages.filter((mensagem: Linter.LintMessage) => mensagem.fatal === true)
  expect(fatais, `a fixture ${fixture} não compila`).toEqual([])
  return resultado.messages
    .filter((mensagem) => mensagem.ruleId !== null && regras.has(mensagem.ruleId))
    .map((mensagem) => `${mensagem.line} ${mensagem.ruleId}`)
    .sort()
}

describe('processadores do worker: nenhuma afirmação de tipo (totais do expurgo, A0b)', () => {
  it('reprova `{} as T` e o `Partial<T>` afirmado no fim; o objeto literal tipado e o `as const` passam', async () => {
    const fixture = 'afirmacao-de-tipo-no-processador.ts'
    const regras = new Set(['@typescript-eslint/consistent-type-assertions'])
    expect(await lintar(eslint, fixture, 'apps/worker/src/processadores/x.ts', regras)).toEqual(marcasDeViolacao(fixture))
  })

  it('vale só nos processadores: fora deles, a mesma fixture passa (a regra não subiu para o repositório inteiro)', async () => {
    const regras = new Set(['@typescript-eslint/consistent-type-assertions'])
    for (const caminho of ['apps/api/src/sistema/x.ts', 'apps/worker/src/x.ts']) {
      expect(await lintar(eslint, 'afirmacao-de-tipo-no-processador.ts', caminho, regras), caminho).toEqual([])
    }
  })
})

describe('guarda de espera do serviço do compose', () => {
  it('reprova subir serviço e medir sem esperar, e deixa passar quem espera ou usa --wait', async () => {
    expect(await lintar(eslint, 'esperar-servico.ts', 'apps/despachante/test/fila.int.test.ts')).toEqual(marcasDeViolacao('esperar-servico.ts'))
  })

  it('não vale fora de teste: cenário de carga derruba e religa serviço de propósito', async () => {
    expect(await lintar(eslint, 'esperar-servico.ts', 'infra/scripts/carga-login.ts')).toEqual([])
  })

  it('fica ligada como erro em teste, e desligada fora dele', async () => {
    const configuracaoDe = async (caminho: string) =>
      (await eslint.calculateConfigForFile(join(raizRepositorio, caminho))) as { rules: Record<string, [number, ...unknown[]]> }
    for (const regra of REGRAS_DE_TESTE) {
      expect((await configuracaoDe('apps/despachante/test/fila.int.test.ts')).rules[regra]?.[0], `${regra} em teste`).toBe(2)
      expect((await configuracaoDe('e2e/entrar.spec.ts')).rules[regra]?.[0], `${regra} em e2e`).toBe(2)
      expect((await configuracaoDe('apps/api/src/main.ts')).rules[regra]?.[0] ?? 0, `${regra} fora de teste`).toBe(0)
    }
  })
})

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

  // O protótipo de interface do Gabriel: só front-end, dado sintético, projeto e lint próprios
  // (mockups/README.md). Fica fora do lint da raiz porque quebra regra de propósito para ver como
  // fica; o que impede isso de virar buraco são os dois testes abaixo, que o prendem na pasta.
  const PROTOTIPO = 'mockups/'
  const ehCodigo = (arquivo: string) => /\.(?:[cm]?[jt]s|[jt]sx)$/.test(arquivo)

  it('nenhum código versionado fica fora do lint, exceto as fixtures de violação e o protótipo de mockups/', async () => {
    const codigo = arquivosDoRepositorio().filter(
      (arquivo) => ehCodigo(arquivo) && !arquivo.startsWith('tools/guardas/__fixtures__/') && !arquivo.startsWith(PROTOTIPO),
    )
    expect(codigo.length).toBeGreaterThan(20)
    const ignorados: string[] = []
    for (const arquivo of codigo) {
      if (await eslint.isPathIgnored(join(raizRepositorio, arquivo))) ignorados.push(arquivo)
    }
    expect(ignorados).toEqual([])
  })

  it('o protótipo de mockups/ não é workspace do monorepo', () => {
    const { workspaces } = JSON.parse(readFileSync(join(raizRepositorio, 'package.json'), 'utf8')) as { workspaces: string[] }
    expect(workspaces.length).toBeGreaterThan(0)
    expect(workspaces.filter((glob) => matchesGlob('mockups', glob))).toEqual([])
  })

  // Pela palavra, e não por um padrão de import: alias do Vite, `paths` do tsconfig, `import.meta.glob`,
  // `new URL(...)` e template literal chegam ao protótipo sem escrever `from '.../mockups/'`. Documento
  // (`.md`) pode citar a pasta; os três arquivos abaixo são os que declaram a exceção.
  const CITAM_O_PROTOTIPO = ['eslint.config.mjs', 'vitest.config.ts', 'tools/guardas/guardas.test.ts']

  it('nada fora de mockups/ aponta para o protótipo: o que não passa pelo lint não entra no produto', () => {
    const citam = arquivosDoRepositorio()
      .filter((arquivo) => !arquivo.startsWith(PROTOTIPO) && !arquivo.endsWith('.md') && !CITAM_O_PROTOTIPO.includes(arquivo))
      .filter((arquivo) => readFileSync(join(raizRepositorio, arquivo), 'utf8').includes('mockups'))
    expect(citam).toEqual([])
  })

  it('não existe symlink versionado: por um deles o protótipo entraria sem aparecer no caminho', () => {
    const resultado = spawnSync('git', ['ls-files', '--stage'], { cwd: raizRepositorio, encoding: 'utf8' })
    expect(resultado.status).toBe(0)
    const links = resultado.stdout.split('\n').filter((linha) => linha.startsWith('120000 '))
    expect(links).toEqual([])
  })

  it.each([
    'apps/api/src/main.ts',
    'apps/api/src/sistema/saude.controller.ts',
    'apps/web/src/paginas/Casca.tsx',
    'packages/nucleo/src/log/logger.ts',
    'packages/shared/src/index.ts',
    'tools/ci/verificar.ts',
    'eslint.config.mjs',
  ])('todas as guardas e a vigia de diretiva ficam ligadas como erro em %s', async (caminho) => {
    const configuracao = (await eslint.calculateConfigForFile(join(raizRepositorio, caminho))) as {
      rules: Record<string, [number, ...unknown[]]>
    }
    for (const regra of [...REGRAS_EM_TODO_ARQUIVO, REGRA_DAS_DIRETIVAS]) {
      expect(configuracao.rules[regra]?.[0], `${regra} em ${caminho}`).toBe(2)
    }
  })
})
