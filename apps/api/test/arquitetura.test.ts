import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const RAIZ = fileURLToPath(new URL('../../../', import.meta.url))
const MODULO_SESSAO = 'apps/api/src/sessao/'
const ESTE_ARQUIVO = 'apps/api/test/arquitetura.test.ts'

interface Arquivo {
  caminho: string
  texto: string
}

/** Todo `.ts`, `.tsx`, `.mts`, `.js` e `.mjs` de código e de teste, sem `dist` e sem `node_modules`. */
function arquivosDoRepositorio(): Arquivo[] {
  return ['apps', 'packages', 'infra', 'tools', 'e2e'].flatMap((pasta) =>
    readdirSync(join(RAIZ, pasta), { recursive: true, encoding: 'utf8' })
      .filter((arquivo) => /\.(ts|tsx|mts|js|mjs)$/.test(arquivo))
      .filter((arquivo) => !arquivo.split(sep).some((parte) => parte === 'node_modules' || parte === 'dist'))
      .map((arquivo) => {
        const caminho = relative(RAIZ, join(RAIZ, pasta, arquivo)).split(sep).join('/')
        return { caminho, texto: readFileSync(join(RAIZ, caminho), 'utf8') }
      }),
  )
}

/** Cita a classe ou o arquivo dela: importação, reexportação ou `import()` dinâmico. */
const USO_DA_RESOLUCAO = /\bResolucaoDeTenantRepository\b|resolucao-de-tenant\.repository/

/**
 * Os arquivos fora de `apps/api/src/sessao` que usam a `ResolucaoDeTenantRepository`. A classe concentra os
 * `@SemEscopo` da resolução de tenant (Tech Spec, seção 6), e o desvio da regra 10, item 9 só é aceito porque fica
 * contido no módulo de sessão.
 */
function usosForaDoModuloSessao(arquivos: readonly Arquivo[]): string[] {
  return arquivos
    .filter((arquivo) => !arquivo.caminho.startsWith(MODULO_SESSAO) && arquivo.caminho !== ESTE_ARQUIVO)
    .filter((arquivo) => USO_DA_RESOLUCAO.test(arquivo.texto))
    .map((arquivo) => arquivo.caminho)
}

describe('arquitetura: a resolução de tenant fica dentro do módulo de sessão', () => {
  it('a varredura enxerga o código: acha a própria classe dentro do módulo de sessão', () => {
    const arquivos = arquivosDoRepositorio()
    expect(arquivos.length).toBeGreaterThan(100)
    expect(arquivos.filter((arquivo) => USO_DA_RESOLUCAO.test(arquivo.texto)).map((arquivo) => arquivo.caminho)).toContain('apps/api/src/sessao/resolucao-de-tenant.repository.ts')
  })

  it('nenhum arquivo fora de apps/api/src/sessao importa ou cita a ResolucaoDeTenantRepository', () => {
    expect(usosForaDoModuloSessao(arquivosDoRepositorio())).toEqual([])
  })

  it('reprova o arquivo de fora que a importa, reexporta ou carrega por import dinâmico', () => {
    const fora = [
      { caminho: 'apps/api/src/estrutura/turma.service.ts', texto: "import { ResolucaoDeTenantRepository } from '../sessao/resolucao-de-tenant.repository.js'" },
      { caminho: 'apps/api/src/sistema/atalho.ts', texto: "export * from '../sessao/resolucao-de-tenant.repository.js'" },
      { caminho: 'apps/worker/src/expurgo.ts', texto: "const modulo = await import('../../api/src/sessao/resolucao-de-tenant.repository.js')" },
    ]
    const dentro = { caminho: 'apps/api/src/sessao/login.service.ts', texto: "import { ResolucaoDeTenantRepository } from './resolucao-de-tenant.repository.js'" }
    expect(usosForaDoModuloSessao([...fora, dentro])).toEqual(fora.map((arquivo) => arquivo.caminho))
  })
})
