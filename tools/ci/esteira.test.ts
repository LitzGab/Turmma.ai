import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { raizRepositorio } from './executar.ts'
import { FRACAO_DE_FOLGA_DO_E2E, minutosEstimadosDoE2e, tetoDoE2e } from './prazo-do-e2e.ts'

interface Passo {
  uses?: string
  run?: string
  if?: string
  env?: unknown
  with?: Record<string, unknown>
}

interface Job {
  name?: string
  'timeout-minutes'?: number
  strategy?: { 'fail-fast'?: unknown; matrix?: Record<string, unknown> }
  permissions?: unknown
  env?: unknown
  steps: Passo[]
}

interface ProjetoDoPlaywright {
  name?: string
  outputDir?: string
  use?: { trace?: unknown }
}

interface ConfiguracaoDoPlaywright {
  outputDir?: string
  use?: { trace?: unknown }
  projects?: ProjetoDoPlaywright[]
}

/**
 * O nome do artefato é contrato: é por ele que se procura o traço na execução que falhou. Um por fatia, com o número
 * dela no fim: duas fatias publicando o mesmo nome na mesma execução teriam a segunda recusada.
 */
const NOME_DO_ARTEFATO_DO_TRACO = 'traco-do-e2e-${{ matrix.fatia }}'
/** A única expressão que o workflow aceita: o número da fatia do e2e, que vem da lista fixa da própria matriz. */
const EXPRESSAO_DA_FATIA = '${{ matrix.fatia }}'
/**
 * O modo de traço que guarda o arquivo do caso que falhou, e só dele. `'on'` também guardaria na falha,
 * mas retém os 132 casos: o artefato passaria a levar a suíte inteira, e ele é público (regra 20).
 */
const MODOS_QUE_GUARDAM_NA_FALHA = ['retain-on-failure'] as const
/** Onde o Playwright escreve quando `outputDir` não é declarado. */
const PADRAO_DO_DIRETORIO_DE_SAIDA = 'test-results'

/**
 * Quantos casos o Playwright vai rodar, pelos dois projetos, na fatia pedida (ou na suíte inteira): é ele quem conta e
 * quem reparte, e não uma busca por `test(` no fonte nem uma divisão feita aqui.
 */
function casosDoE2e(argumentos: readonly string[] = []): number {
  const lista = spawnSync('npx', ['playwright', 'test', '--list', ...argumentos], { cwd: raizRepositorio, encoding: 'utf8' })
  expect(lista.status, lista.stderr).toBe(0)
  return Number(/^Total: (\d+) tests? in \d+ files?$/m.exec(lista.stdout)?.[1])
}

/**
 * Os índices das fatias do e2e, pela matriz do job (`strategy.matrix.fatia`). Sem matriz, uma fatia só: a suíte inteira
 * num job, que é como a esteira estava até a correção 2026-10-03-e2e-em-fatias.
 */
function fatiasDoE2e(): number[] {
  const matriz = workflow.jobs['e2e']?.strategy?.matrix
  if (matriz === undefined) return [1]
  // Só a fatia: `include` ou `exclude` acrescentariam ou tirariam jobs sem a guarda ver.
  expect(Object.keys(matriz)).toEqual(['fatia'])
  const fatias = matriz['fatia']
  expect(Array.isArray(fatias), 'strategy.matrix.fatia do e2e é uma lista').toBe(true)
  const indices = fatias as number[]
  // De 1 a n, sem buraco nem repetição: a fatia que falta na matriz é suíte que deixa de rodar sem nenhum vermelho.
  expect(indices).toEqual(Array.from({ length: indices.length }, (_, posicao) => posicao + 1))
  return indices
}

interface Workflow {
  on: { push?: { branches?: string[] } } & Record<string, unknown>
  permissions?: unknown
  env?: unknown
  jobs: Record<string, Job>
}

const textoWorkflow = readFileSync(join(raizRepositorio, '.github/workflows/ci.yml'), 'utf8')
const workflow = parse(textoWorkflow) as Workflow
const scripts = (JSON.parse(readFileSync(join(raizRepositorio, 'package.json'), 'utf8')) as { scripts: Record<string, string> })
  .scripts

describe('esteira do GitHub (.github/workflows/ci.yml)', () => {
  it('roda em todo push nas branches integradoras, e só em push ou execução manual', () => {
    // O trabalho acontece na `develop` (D23 revista). Sem ela aqui, nada do que se constrói é
    // testado até o merge — e a D52 e a regra 40 dependem de a esteira rodar onde se trabalha.
    expect(workflow.on.push?.branches).toEqual(['develop', 'release', 'main'])
    expect(Object.keys(workflow.on).sort()).toEqual(['push', 'workflow_dispatch'])
  })

  it('só pede leitura do conteúdo, e nenhum job amplia a permissão', () => {
    expect(workflow.permissions).toEqual({ contents: 'read' })
    for (const job of Object.values(workflow.jobs)) {
      expect(job.permissions).toBeUndefined()
    }
  })

  it('não usa segredo, variável do repositório nem ambiente declarado no YAML', () => {
    expect(textoWorkflow).not.toMatch(/secrets\s*[.[]/)
    // Nenhuma expressão além do número da fatia do e2e: segredo, `vars.*` e contexto externo só entram por `${{ }}`, e o
    // `matrix.fatia` vem da lista fixa do próprio YAML, sem nada de fora.
    const expressoes = textoWorkflow.match(/\$\{\{[^}]*\}\}/g) ?? []
    expect(expressoes.length).toBeGreaterThan(0)
    for (const expressao of expressoes) expect(expressao).toBe(EXPRESSAO_DA_FATIA)
    expect(textoWorkflow.split('${{').length - 1).toBe(expressoes.length)
    expect(workflow.env).toBeUndefined()
    for (const job of Object.values(workflow.jobs)) {
      expect(job.env).toBeUndefined()
      for (const passo of job.steps) expect(passo.env).toBeUndefined()
    }
  })

  it('tem os jobs verificar, integracao, infra e e2e, e cada um só chama npm ci e o seu npm run ci:*', () => {
    expect(Object.keys(workflow.jobs).sort()).toEqual(['e2e', 'infra', 'integracao', 'verificar'])
    for (const [nome, job] of Object.entries(workflow.jobs)) {
      const comandos = job.steps.flatMap((passo) => (passo.run === undefined ? [] : [passo.run.trim()]))
      // O e2e passa a fatia dele, e o total do `--shard` é o tamanho da matriz: `/3` com quatro fatias rodaria a quarta
      // fatia de três, que não existe, e a de `/5` deixaria um quinto da suíte sem rodar.
      const argumentos = nome === 'e2e' ? ` -- --shard=${EXPRESSAO_DA_FATIA}/${String(fatiasDoE2e().length)}` : ''
      expect(comandos).toEqual(['npm ci', `npm run ci:${nome}${argumentos}`])
      expect(scripts[`ci:${nome}`]).toMatch(/^node tools\/ci\/[a-z0-9]+\.ts$/)
    }
  })

  it('o e2e roda em fatias que não se cancelam: o vermelho de uma não esconde o das outras, nem o traço delas', () => {
    const job = workflow.jobs['e2e']
    expect(fatiasDoE2e().length).toBeGreaterThan(1)
    expect(job?.strategy?.['fail-fast']).toBe(false)
    // O nome mostra a fatia: sem isso, os jobs da execução aparecem iguais e não se sabe qual ficou vermelho.
    expect(job?.name).toContain(`${EXPRESSAO_DA_FATIA}/${String(fatiasDoE2e().length)}`)
  })

  it('só usa ações oficiais da própria GitHub, fixadas por SHA completo, e não por tag que pode ser movida', () => {
    const passos = Object.values(workflow.jobs).flatMap((job) => job.steps.filter((passo) => passo.uses !== undefined))
    expect(passos.length).toBeGreaterThan(0)
    for (const passo of passos) {
      // A lista é fechada de propósito: ação de terceiro na esteira roda com acesso ao repositório clonado.
      expect(passo.uses).toMatch(/^actions\/(checkout|setup-node|upload-artifact)@[0-9a-f]{40}$/)
    }
  })

  it('o e2e publica o traço da falha, só quando falha e por prazo curto: sem isso o vermelho fica indiagnosticável', async () => {
    const passos = workflow.jobs['e2e']?.steps ?? []
    const publicacoes = passos.filter((passo) => passo.uses?.startsWith('actions/upload-artifact@'))
    expect(publicacoes).toHaveLength(1)
    const [publicacao] = publicacoes
    expect(publicacao).toBeDefined()
    expect(publicacao?.with?.['name']).toBe(NOME_DO_ARTEFATO_DO_TRACO)
    // As duas condições, sem depender da ordem em que estão escritas: `always()` ou só uma delas fica vermelho.
    expect(publicacao?.if).toContain('failure()')
    expect(publicacao?.if).toContain('cancelled()')
    // E só elas: `success()` ou `always()` publicariam também na execução verde, contra o "só quando falha" do título.
    expect(publicacao?.if).not.toContain('success()')
    expect(publicacao?.if).not.toMatch(/\balways\(\)/)
    // Diretório vazio precisa aparecer no log: é o sintoma de a configuração do traço ter mudado.
    expect(publicacao?.with?.['if-no-files-found']).toBe('warn')
    // O `cancelled()` só tem o que cobrir porque o job tem prazo: sem ele, a condição fica inofensiva em silêncio.
    expect(Number(workflow.jobs['e2e']?.['timeout-minutes'])).toBeGreaterThan(0)

    // Depois de rodar o e2e: antes dele, o `if` dispararia por falha do `npm ci` e não haveria traço nenhum.
    const indiceDoE2e = passos.findIndex((passo) => passo.run?.trim().startsWith('npm run ci:e2e') === true)
    expect(indiceDoE2e).toBeGreaterThanOrEqual(0)
    expect(passos.findIndex((passo) => passo.uses?.startsWith('actions/upload-artifact@'))).toBeGreaterThan(indiceDoE2e)

    // Prazo curto: o artefato leva captura de tela e corpo de requisição do e2e (sintéticos, regra 20, item 17),
    // e serve para diagnosticar aquela execução, não para arquivo.
    const prazo = Number(publicacao?.with?.['retention-days'])
    expect(prazo).toBeGreaterThan(0)
    expect(prazo).toBeLessThanOrEqual(7)

    // O elo que faltava: sem amarrar ao `playwright.config.ts`, `trace: 'off'` ou outro `outputDir` deixariam
    // a esteira verde publicando um diretório vazio, e o defeito voltaria em silêncio.
    //
    // Resolvido **por projeto**, não só no `use` de topo: `projects[].use` vence o topo, então `trace: 'on'`
    // dentro do `celular` passaria a retar o traço dos casos verdes dele, e `outputDir` no projeto jogaria o
    // traço fora do que se publica. Os dois deixariam a guarda verde se ela olhasse só o topo.
    const configuracao = (await import('../../playwright.config.ts')) as { default: ConfiguracaoDoPlaywright }
    const caminhoPublicado = String(publicacao?.with?.['path']).replace(/\/$/, '')
    const projetos = configuracao.default.projects ?? []
    expect(projetos.length).toBeGreaterThan(0)
    for (const projeto of [...projetos, {} as ProjetoDoPlaywright]) {
      const modo = projeto.use?.trace ?? configuracao.default.use?.trace
      expect(MODOS_QUE_GUARDAM_NA_FALHA, `modo de traço de ${projeto.name ?? 'topo'}`).toContain(modo)
      const saida = projeto.outputDir ?? configuracao.default.outputDir ?? PADRAO_DO_DIRETORIO_DE_SAIDA
      expect(caminhoPublicado, `diretório de saída de ${projeto.name ?? 'topo'}`).toBe(saida.replace(/\/$/, ''))
    }
  })

  it('o teto do e2e cobre a suíte que existe, fatia a fatia e com folga: estourado, a esteira cancela o job sem nenhum teste vermelho', () => {
    const teto = Number(workflow.jobs['e2e']?.['timeout-minutes'])
    expect(teto).toBe(tetoDoE2e())
    const indices = fatiasDoE2e()
    const total = casosDoE2e()
    expect(total).toBeGreaterThan(0)
    const limite = teto * FRACAO_DE_FOLGA_DO_E2E
    let somados = 0
    for (const indice of indices) {
      const casos = indices.length === 1 ? total : casosDoE2e([`--shard=${String(indice)}/${String(indices.length)}`])
      expect(casos, `fatia ${String(indice)}`).toBeGreaterThan(0)
      somados += casos
      const minutos = minutosEstimadosDoE2e(casos)
      expect(
        minutos,
        `a fatia ${String(indice)} de ${String(indices.length)} do e2e tem ${String(casos)} casos, uns ${String(minutos)} min no runner, e ` +
          `o teto do job é de ${String(teto)} min: passa de ${String(Math.round(FRACAO_DE_FOLGA_DO_E2E * 100))}% dele, e a esteira ` +
          'chega ao cancelamento com a suíte verde. O que fazer está em docs/runbook.md, "Esteira vermelha no e2e".',
      ).toBeLessThanOrEqual(limite)
    }
    // As fatias juntas são a suíte. Quase tautológico, porque é o próprio Playwright quem reparte; o que pega a fatia
    // esquecida de fato são a matriz `1..n` (`fatiasDoE2e`) e o `/n` do passo, no teste dos comandos.
    expect(somados).toBe(total)
  }, 60_000)

  it('nenhum outro job publica artefato: só o e2e produz traço, e artefato de esteira é superfície a mais', () => {
    for (const [nome, job] of Object.entries(workflow.jobs)) {
      if (nome === 'e2e') continue
      expect(job.steps.filter((passo) => passo.uses?.startsWith('actions/upload-artifact@'))).toEqual([])
    }
  })

  it('o verificar baixa o histórico inteiro, para o gitleaks varrer todo commit e não só o último', () => {
    const checkout = workflow.jobs['verificar']?.steps.find((passo) => passo.uses?.startsWith('actions/checkout@'))
    expect(checkout?.with?.['fetch-depth']).toBe(0)
  })

  it('o checkout não deixa o token do GitHub gravado no repositório clonado', () => {
    const checkouts = Object.values(workflow.jobs).flatMap((job) =>
      job.steps.filter((passo) => passo.uses?.startsWith('actions/checkout@')),
    )
    expect(checkouts).toHaveLength(Object.keys(workflow.jobs).length)
    for (const checkout of checkouts) {
      expect(checkout.with?.['persist-credentials']).toBe(false)
    }
  })
})
