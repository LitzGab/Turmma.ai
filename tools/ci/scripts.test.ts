import { spawnSync } from 'node:child_process'
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
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
  it('ci:verificar roda tipos, lint e unidade, e sai verde só se todos passarem', () => {
    const verde = rodarScript('verificar.ts', null)
    expect(verde.codigo).toBe(0)
    expect(verde.chamadas).toEqual(['npm run typecheck', 'npm run lint', 'npm run test:unidade'])

    const vermelho = rodarScript('verificar.ts', 'npm run test:unidade')
    expect(vermelho.codigo).not.toBe(0)
  })

  it('ci:integracao roda a integração, sai vermelho quando ela falha e ainda derruba o compose', () => {
    const verde = rodarScript('integracao.ts', null)
    expect(verde.codigo).toBe(0)
    expect(indiceDe(verde.chamadas, 'npm run test:integracao')).toBeGreaterThan(indiceDe(verde.chamadas, ' up '))
    expect(indiceDe(verde.chamadas, ' down ')).toBeGreaterThan(indiceDe(verde.chamadas, 'npm run test:integracao'))

    const vermelho = rodarScript('integracao.ts', 'npm run test:integracao')
    expect(vermelho.codigo).not.toBe(0)
    expect(indiceDe(vermelho.chamadas, ' down ')).toBeGreaterThan(indiceDe(vermelho.chamadas, 'npm run test:integracao'))
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

  it('test:e2e mantém o ambiente de pé para o desenvolvedor, mas não esconde a falha', () => {
    const vermelho = rodarScript('e2e.ts', 'npx playwright test', ['--manter-ambiente'])
    expect(vermelho.codigo).not.toBe(0)
    expect(indiceDe(vermelho.chamadas, ' down ')).toBe(-1)
  })

  it.each(['integracao.ts', 'e2e.ts'])('todo compose de %s usa o projeto de teste e só os arquivos de ambiente versionados', (script) => {
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
