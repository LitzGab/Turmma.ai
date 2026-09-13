import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { raizRepositorio } from './executar.ts'

interface Passo {
  uses?: string
  run?: string
  env?: unknown
  with?: Record<string, unknown>
}

interface Job {
  permissions?: unknown
  env?: unknown
  steps: Passo[]
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

  it('tem os jobs verificar, integracao e e2e, e cada um só chama npm ci e o seu npm run ci:*', () => {
    expect(Object.keys(workflow.jobs).sort()).toEqual(['e2e', 'integracao', 'verificar'])
    for (const [nome, job] of Object.entries(workflow.jobs)) {
      const comandos = job.steps.flatMap((passo) => (passo.run === undefined ? [] : [passo.run.trim()]))
      expect(comandos).toEqual(['npm ci', `npm run ci:${nome}`])
      expect(scripts[`ci:${nome}`]).toMatch(/^node tools\/ci\/[a-z0-9]+\.ts$/)
    }
  })

  it('só usa checkout e setup-node oficiais, fixados por SHA completo, e não por tag que pode ser movida', () => {
    const passos = Object.values(workflow.jobs).flatMap((job) => job.steps.filter((passo) => passo.uses !== undefined))
    expect(passos.length).toBeGreaterThan(0)
    for (const passo of passos) {
      expect(passo.uses).toMatch(/^actions\/(checkout|setup-node)@[0-9a-f]{40}$/)
    }
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
