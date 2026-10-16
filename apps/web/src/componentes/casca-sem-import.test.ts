import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { PECAS_FORA_DA_ENTRADA } from '../../nome-dos-chunks'

/**
 * A casca é da entrada (Tech Spec da X1, seções 7c e 9; `docs/interface.md` 10.4): ela desenha o primeiro quadro, e por
 * isso **não busca nada por `import()`** nem importa peça que a entrada não baixa. O build prova o peso
 * (`apps/web/nome-dos-chunks.test.ts`); aqui está o que se vê no fonte, que reprova antes de o build rodar: o `import()`
 * dinâmico, a peça de `PECAS_FORA_DA_ENTRADA` e a pasta `componentes/ia/` ou `componentes/onca/`.
 */
const pasta = dirname(fileURLToPath(import.meta.url))
const ARQUIVOS_DA_CASCA = ['CascaDaEscola.tsx', 'BarraDeBaixo.tsx', 'itens-da-lateral.tsx', 'MenuDaPessoa.tsx', 'SeletorDeEscola.tsx', 'lateral-recolhida.ts', 'Aparencia.tsx', 'Segmentado.tsx', 'Ladrilho.tsx', 'Icone.tsx', 'Marca.tsx', 'gaveta.ts', 'ancora-do-sino.ts'] as const

function fonteDe(arquivo: string): string {
  return readFileSync(join(pasta, arquivo), 'utf8')
}

/** O fonte sem comentário, para o texto de um docblock que cita `import()` não valer como uso. */
function semComentarios(fonte: string): string {
  return fonte.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')
}

/**
 * Cada módulo que o arquivo importa, estaticamente, com o caminho como está escrito. O `import type` fica de fora: o
 * compilador o apaga, e ele não leva módulo nenhum para a entrada (o `Ladrilho` e `areas/navegacao.ts` só tomam o tipo
 * `FamiliaDeCor` do `Contador`).
 */
function importados(fonte: string): string[] {
  return [...semComentarios(fonte).matchAll(/(?:^|\s)(?:import|export)\s(?!type\s)[^'"]*?from\s+'([^']+)'/g)].map(([, caminho = '']) => caminho)
}

/**
 * Por que um caminho importado não pode estar na casca, ou `null`. Só olha o relativo (o pacote de fora é do build). O
 * caminho passa pela normalização que tira os `../` e o `componentes/` do começo, para `'../componentes/Contador'` e
 * `'./Contador'` serem a mesma peça.
 */
function motivoDeFora(caminho: string): string | null {
  if (!caminho.startsWith('.')) return null
  if (/(?:^|\/)(?:ia|onca)\//.test(caminho)) return 'pasta fora da entrada'
  const nome = caminho.replace(/^(?:\.\.?\/)+(?:componentes\/)?/, '')
  return new Set<string>(PECAS_FORA_DA_ENTRADA).has(nome) ? 'peça fora da entrada' : null
}

describe('a casca da escola, da entrada', () => {
  it('a lista de arquivos da casca existe: sem arquivo, o caso passaria vazio', () => {
    for (const arquivo of ARQUIVOS_DA_CASCA) expect(fonteDe(arquivo).length, arquivo).toBeGreaterThan(0)
  })

  it.each(ARQUIVOS_DA_CASCA)('%s não tem `import()` nem `lazy()`: nada do primeiro quadro vem depois dele', (arquivo) => {
    const fonte = semComentarios(fonteDe(arquivo))
    expect(fonte).not.toMatch(/\bimport\s*\(/)
    expect(fonte).not.toMatch(/\blazy\s*\(/)
  })

  it.each(ARQUIVOS_DA_CASCA)('%s não importa peça fora da entrada, `componentes/ia/` nem a onça', (arquivo) => {
    for (const caminho of importados(fonteDe(arquivo))) {
      expect(motivoDeFora(caminho), `${arquivo} importa ${caminho}`).toBeNull()
    }
  })

  it('o detector enxerga o `import()`, a peça e a pasta proibidas (sem isto, os casos acima passariam sempre)', () => {
    expect(semComentarios("const Menu = lazy(() => import('./Menu'))")).toMatch(/\bimport\s*\(/)
    expect(semComentarios("// import('./Menu') e lazy(...)\n/* import('x') */ const a = 1")).not.toMatch(/\bimport\s*\(/)
    expect(importados("import { Contador } from './Contador'\nimport { Dica } from './itens-da-lateral'")).toEqual(['./Contador', './itens-da-lateral'])
    expect(importados("import { Icone } from './Icone'")).toEqual(['./Icone'])
    // O tipo, que o compilador apaga, não conta: `import type` não leva módulo.
    expect(importados("import type { FamiliaDeCor } from './Contador'")).toEqual([])
    expect(importados("import { AssinaturaIA } from './ia/AssinaturaIA'")).toEqual(['./ia/AssinaturaIA'])
  })

  it('o detector reprova a peça e a pasta por caminho relativo, também o que sobe e desce, e deixa passar a da entrada', () => {
    expect(motivoDeFora('./Contador')).toBe('peça fora da entrada')
    expect(motivoDeFora('../componentes/Contador')).toBe('peça fora da entrada')
    expect(motivoDeFora('../../componentes/Contador')).toBe('peça fora da entrada')
    expect(motivoDeFora('./ia/AssinaturaIA')).toBe('pasta fora da entrada')
    expect(motivoDeFora('../componentes/onca/Onca')).toBe('pasta fora da entrada')
    // O que a entrada baixa e o que não é relativo passam.
    expect(motivoDeFora('./Icone')).toBeNull()
    expect(motivoDeFora('../componentes/Ladrilho')).toBeNull()
    expect(motivoDeFora('react')).toBeNull()
  })
})
