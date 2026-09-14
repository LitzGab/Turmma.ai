import { spawnSync } from 'node:child_process'
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { argumentosGitleaks, IMAGEM_GITLEAKS } from './etapas-de-guarda.ts'
import { raizRepositorio } from './executar.ts'

// Os scripts reais da esteira, com `npm`, `npx` e `docker` trocados por imitações que só
// registram a chamada. Prova que cada `ci:*` roda o teste, não engole a falha e derruba o
// ambiente, sem subir compose nem rodar a suíte de verdade.

const diretorios: string[] = []

afterEach(() => {
  for (const diretorio of diretorios.splice(0)) rmSync(diretorio, { recursive: true, force: true })
})

interface Execucao {
  codigo: number | null
  chamadas: string[]
}

function rodarScript(script: string, falharQuandoContem: string | null, argumentos: string[] = []): Execucao {
  const diretorio = mkdtempSync(join(tmpdir(), 'educa-esteira-'))
  diretorios.push(diretorio)
  const registro = join(diretorio, 'chamadas.log')
  for (const comando of ['npm', 'npx', 'docker']) {
    const imitacao = join(diretorio, comando)
    writeFileSync(
      imitacao,
      [
        '#!/bin/sh',
        `linha="${comando} $*"`,
        'echo "$linha" >> "$IMITACAO_REGISTRO"',
        'case "$linha" in *"$IMITACAO_FALHAR"*) [ -n "$IMITACAO_FALHAR" ] && exit 1 ;; esac',
        'exit 0',
        '',
      ].join('\n'),
    )
    chmodSync(imitacao, 0o755)
  }
  writeFileSync(registro, '')
  const resultado = spawnSync(process.execPath, [join('tools/ci', script), ...argumentos], {
    cwd: raizRepositorio,
    encoding: 'utf8',
    env: {
      ...process.env,
      CI: 'true',
      PATH: `${diretorio}${delimiter}${process.env['PATH'] ?? ''}`,
      IMITACAO_REGISTRO: registro,
      IMITACAO_FALHAR: falharQuandoContem ?? '',
    },
  })
  return { codigo: resultado.status, chamadas: readFileSync(registro, 'utf8').trim().split('\n').filter(Boolean) }
}

function indiceDe(chamadas: string[], trecho: string): number {
  return chamadas.findIndex((chamada) => chamada.includes(trecho))
}

describe('scripts ci:* reais', () => {
  it('ci:verificar roda tipos, lint com guardas, gitleaks, npm audit e unidade, e sai verde só se todos passarem', () => {
    const verde = rodarScript('verificar.ts', null)
    expect(verde.codigo).toBe(0)
    expect(verde.chamadas).toEqual([
      'npm run typecheck',
      'npm run lint',
      `docker ${argumentosGitleaks(raizRepositorio).join(' ')}`,
      'npm audit --audit-level=high --omit=dev',
      'npm run test:unidade',
    ])
  })

  it.each(['npm run lint', IMAGEM_GITLEAKS, 'npm audit --audit-level=high --omit=dev', 'npm run test:unidade'])(
    'ci:verificar sai vermelho quando "%s" falha: guarda é portão, não aviso',
    (etapa) => {
      expect(rodarScript('verificar.ts', etapa).codigo).not.toBe(0)
    },
  )

  it.each([
    ['integracao.ts', 'npm run test:integracao'],
    ['infra.ts', 'npm run test:infra'],
  ])('%s roda os seus testes, sai vermelho quando eles falham e ainda derruba o compose', (script, teste) => {
    const verde = rodarScript(script, null)
    expect(verde.codigo).toBe(0)
    expect(indiceDe(verde.chamadas, teste)).toBeGreaterThan(indiceDe(verde.chamadas, ' up '))
    expect(indiceDe(verde.chamadas, ' down ')).toBeGreaterThan(indiceDe(verde.chamadas, teste))

    const vermelho = rodarScript(script, teste)
    expect(vermelho.codigo).not.toBe(0)
    expect(indiceDe(vermelho.chamadas, ' down ')).toBeGreaterThan(indiceDe(vermelho.chamadas, teste))
  })

  it('a esteira roda todo projeto do Vitest, e o `npm run test` do portão da tarefa só deixa de fora o de infra (D52)', async () => {
    const { default: configuracao } = await import('../../vitest.config.ts')
    const projetos = (configuracao.test?.projects ?? []).map((projeto) => (typeof projeto === 'object' && 'test' in projeto ? projeto.test?.name : undefined))
    expect(projetos).toEqual(['unidade', 'integracao', 'infra'])

    const scripts = (JSON.parse(readFileSync(join(raizRepositorio, 'package.json'), 'utf8')) as { scripts: Record<string, string> }).scripts
    const chamadasDaEsteira = ['verificar.ts', 'integracao.ts', 'infra.ts'].flatMap((script) => rodarScript(script, null).chamadas)
    for (const projeto of projetos) {
      expect(scripts[`test:${String(projeto)}`]).toBe(`vitest run --project ${String(projeto)}`)
      expect(chamadasDaEsteira).toContain(`npm run test:${String(projeto)}`)
    }
    expect(scripts['test']).toBe('vitest run --project unidade --project integracao')
  })

  it('ci:e2e roda o Playwright, sai vermelho quando ele falha e ainda derruba o compose', () => {
    const verde = rodarScript('e2e.ts', null)
    expect(verde.codigo).toBe(0)
    expect(indiceDe(verde.chamadas, 'npx playwright test')).toBeGreaterThan(indiceDe(verde.chamadas, ' up '))
    expect(indiceDe(verde.chamadas, ' down ')).toBeGreaterThan(indiceDe(verde.chamadas, 'npx playwright test'))

    const vermelho = rodarScript('e2e.ts', 'npx playwright test')
    expect(vermelho.codigo).not.toBe(0)
    expect(indiceDe(vermelho.chamadas, ' down ')).toBeGreaterThan(indiceDe(vermelho.chamadas, 'npx playwright test'))
  })

  it('ci:e2e mede o teto do bundle depois do build da web e antes do Playwright, e sai vermelho quando ele estoura', () => {
    const verde = rodarScript('e2e.ts', null)
    const build = indiceDe(verde.chamadas, 'npm run build -w @educa/web')
    const teto = indiceDe(verde.chamadas, 'npx size-limit')
    expect(build).toBeGreaterThanOrEqual(0)
    expect(teto).toBeGreaterThan(build)
    expect(indiceDe(verde.chamadas, 'npx playwright test')).toBeGreaterThan(teto)

    const vermelho = rodarScript('e2e.ts', 'npx size-limit')
    expect(vermelho.codigo).not.toBe(0)
    expect(indiceDe(vermelho.chamadas, 'npx playwright test')).toBe(-1)
  })

  it('test:e2e mantém o ambiente de pé para o desenvolvedor, mas não esconde a falha', () => {
    const vermelho = rodarScript('e2e.ts', 'npx playwright test', ['--manter-ambiente'])
    expect(vermelho.codigo).not.toBe(0)
    expect(indiceDe(vermelho.chamadas, ' down ')).toBe(-1)
  })

  it.each(['integracao.ts', 'infra.ts', 'e2e.ts'])('todo compose de %s usa o projeto de teste e só os arquivos de ambiente versionados', (script) => {
    const { chamadas } = rodarScript(script, null)
    const composes = chamadas.filter((chamada) => chamada.startsWith('docker compose'))
    expect(composes.length).toBeGreaterThan(0)
    for (const chamada of composes) {
      expect(chamada).toContain(
        'docker compose --project-name educa-teste --env-file .env.example --env-file infra/teste.env -f infra/compose.yml',
      )
    }
  })
})
