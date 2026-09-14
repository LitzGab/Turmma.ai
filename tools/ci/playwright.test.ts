import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import configuracao from '../../playwright.config.ts'
import { REDE_FAST_3G, type PerfilDeMaquina } from '../../e2e/__fixtures__/perfis.ts'
import { raizRepositorio } from './executar.ts'

// A configuração do Playwright é portão da D51: se um projeto sumir, perder a limitação ou filtrar spec, o e2e
// continua verde sem testar o Chromebook fraco ou o celular. Estas asserções reprovam isso antes.

interface UsoDoProjeto {
  browserName?: string
  defaultBrowserType?: string
  viewport?: { width: number; height: number }
  isMobile?: boolean
  hasTouch?: boolean
  perfil?: PerfilDeMaquina
}

const projetos = (configuracao.projects ?? []) as { name?: string; use?: UsoDoProjeto; testMatch?: unknown; testIgnore?: unknown; testDir?: unknown }[]
const projeto = (nome: string) => projetos.find((candidato) => candidato.name === nome)

describe('projetos do Playwright (playwright.config.ts)', () => {
  it('são exatamente chromebook e celular, e nenhum filtra spec: todo spec de tela roda nos dois', () => {
    expect(projetos.map((candidato) => candidato.name)).toEqual(['chromebook', 'celular'])
    expect(configuracao.testDir).toBe('e2e')
    expect(configuracao.testMatch).toBeUndefined()
    expect(configuracao.testIgnore).toBeUndefined()
    for (const candidato of projetos) {
      expect(candidato.testMatch, candidato.name).toBeUndefined()
      expect(candidato.testIgnore, candidato.name).toBeUndefined()
      expect(candidato.testDir, candidato.name).toBeUndefined()
    }
  })

  it('chromebook: Chromium com CPU ×4 e Fast 3G do DevTools', () => {
    const uso = projeto('chromebook')?.use
    expect(uso?.defaultBrowserType ?? uso?.browserName).toBe('chromium')
    expect(uso?.perfil).toEqual({ cpuMaisLenta: 4, rede: REDE_FAST_3G })
    expect(REDE_FAST_3G).toEqual({ nome: 'Fast 3G', latenciaMs: 562.5, downloadBytesPorSegundo: 180_000, uploadBytesPorSegundo: 84_375 })
  })

  it('celular: Chromium de 360 × 800 com toque e modo móvel, CPU ×4 e rede no máximo tão boa quanto o Fast 3G', () => {
    const uso = projeto('celular')?.use
    expect(uso?.browserName).toBe('chromium')
    expect(uso?.viewport).toEqual({ width: 360, height: 800 })
    expect(uso?.isMobile).toBe(true)
    expect(uso?.hasTouch).toBe(true)
    expect(uso?.perfil?.cpuMaisLenta).toBe(4)
    expect(uso?.perfil?.rede.latenciaMs).toBeGreaterThanOrEqual(REDE_FAST_3G.latenciaMs)
    expect(uso?.perfil?.rede.downloadBytesPorSegundo).toBeLessThanOrEqual(REDE_FAST_3G.downloadBytesPorSegundo)
    expect(uso?.perfil?.rede.uploadBytesPorSegundo).toBeLessThanOrEqual(REDE_FAST_3G.uploadBytesPorSegundo)
  })

  it('todo spec usa o test com perfil de e2e/__fixtures__/perfis.ts, e não o de @playwright/test, que pula a limitação', () => {
    const specs = readdirSync(join(raizRepositorio, 'e2e')).filter((arquivo) => arquivo.endsWith('.spec.ts'))
    expect(specs.length).toBeGreaterThan(0)
    for (const spec of specs) {
      const texto = readFileSync(join(raizRepositorio, 'e2e', spec), 'utf8')
      expect(texto, spec).toMatch(/import \{[^}]*\btest\b[^}]*\} from '\.\/__fixtures__\/perfis\.ts'/)
      // De @playwright/test, só import de tipo.
      for (const importacao of texto.matchAll(/import (type )?[^;\n]*from '@playwright\/test'/g)) {
        expect(importacao[1], `${spec}: ${importacao[0]}`).toBe('type ')
      }
    }
  })
})
