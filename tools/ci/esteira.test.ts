import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { raizRepositorio } from './executar.ts'

interface Passo {
  uses?: string
  run?: string
  if?: string
  env?: unknown
  with?: Record<string, unknown>
}

interface Job {
  'timeout-minutes'?: number
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

/** O nome do artefato é contrato: é por ele que se procura o traço na execução que falhou. */
const NOME_DO_ARTEFATO_DO_TRACO = 'traco-do-e2e'
/**
 * O modo de traço que guarda o arquivo do caso que falhou, e só dele. `'on'` também guardaria na falha,
 * mas retém os 132 casos: o artefato passaria a levar a suíte inteira, e ele é público (regra 20).
 */
const MODOS_QUE_GUARDAM_NA_FALHA = ['retain-on-failure'] as const
/** Onde o Playwright escreve quando `outputDir` não é declarado. */
const PADRAO_DO_DIRETORIO_DE_SAIDA = 'test-results'

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
  it('roda em todo push no main, e só em push ou execução manual', () => {
    expect(workflow.on.push?.branches).toEqual(['main'])
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
    // Nenhuma expressão: segredo, `vars.*` e contexto externo só entram por `${{ }}`.
    expect(textoWorkflow).not.toContain('${{')
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
      expect(comandos).toEqual(['npm ci', `npm run ci:${nome}`])
      expect(scripts[`ci:${nome}`]).toMatch(/^node tools\/ci\/[a-z0-9]+\.ts$/)
    }
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
    const indiceDoE2e = passos.findIndex((passo) => passo.run?.trim() === 'npm run ci:e2e')
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
