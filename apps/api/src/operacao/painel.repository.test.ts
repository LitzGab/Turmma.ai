import { justificativaSemEscopo } from '@educa/nucleo'
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { PainelRepository } from './painel.repository.js'

const RAIZ = fileURLToPath(new URL('../../../../', import.meta.url))

/** Quem, fora de teste, cita o `PainelRepository` ou o arquivo dele. */
function quemUsaOPainelRepository(): string[] {
  return ['apps', 'packages', 'infra', 'tools']
    .flatMap((pasta) =>
      readdirSync(join(RAIZ, pasta), { recursive: true, encoding: 'utf8' })
        .filter((arquivo) => /\.(ts|tsx|mts)$/.test(arquivo) && !/\.test\.ts$/.test(arquivo))
        .filter((arquivo) => !arquivo.split(sep).some((parte) => parte === 'node_modules' || parte === 'dist'))
        .map((arquivo) => relative(RAIZ, join(RAIZ, pasta, arquivo)).split(sep).join('/')),
    )
    .filter((caminho) => caminho !== 'apps/api/src/operacao/painel.repository.ts')
    .filter((caminho) => /\bPainelRepository\b|painel\.repository/.test(readFileSync(join(RAIZ, caminho), 'utf8')))
}

/**
 * A leitura entre escolas do painel mora num repository só (Tech Spec da A0b, seção 6; regra 10, item 9). Nesta tarefa
 * ele tem só `redes`; a 5.0 acrescenta `escolas` e `uso` e leva esta cerca para o `arquitetura.test.ts` (I1).
 */
describe('PainelRepository: o alcance entre escolas, declarado e cercado', () => {
  it('todo método sai sem escopo com justificativa que cita o painel do operador, e são exatamente os previstos', () => {
    const metodos = Object.getOwnPropertyNames(PainelRepository.prototype).filter((nome) => nome !== 'constructor')
    expect(metodos).toEqual(['redes'])
    for (const metodo of metodos) expect(justificativaSemEscopo(PainelRepository, metodo), metodo).toMatch(/^painel do operador: /)
  })

  it('só o painel.service.ts o usa', () => {
    expect(quemUsaOPainelRepository()).toEqual(['apps/api/src/operacao/painel.service.ts'])
  })
})
