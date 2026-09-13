import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseEnv } from 'node:util'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { lerAmbienteExemplo } from './compose.ts'
import { raizRepositorio } from './executar.ts'

const lerArquivo = (caminho: string) => readFileSync(join(raizRepositorio, caminho), 'utf8')

interface Servico {
  healthcheck?: { test?: unknown }
}

describe('.env.example e compose', () => {
  it('toda variável usada pelo compose está definida e preenchida em .env.example', () => {
    const ambiente = lerAmbienteExemplo()
    const usadas = new Set([...lerArquivo('infra/compose.yml').matchAll(/\$\{([A-Z0-9_]+)/g)].map((achado) => achado[1]))
    expect(usadas.size).toBeGreaterThan(0)
    for (const variavel of usadas) {
      expect(ambiente[variavel ?? ''], `${variavel} ausente em .env.example`).toBeTruthy()
    }
  })

  it('toda variável do compose é obrigatória: nada sobe com valor padrão escondido', () => {
    expect(lerArquivo('infra/compose.yml')).not.toMatch(/\$\{[A-Z0-9_]+:?-/)
  })

  it('todo serviço do compose tem healthcheck, para `up --wait` esperar o serviço de verdade', () => {
    // `merge`: as réplicas (api-2, realtime-2) herdam o serviço da primeira com `<<: *âncora`, como no compose.
    const { services } = parse(lerArquivo('infra/compose.yml'), { merge: true }) as { services: Record<string, Servico> }
    expect(Object.keys(services).length).toBeGreaterThan(0)
    for (const [nome, servico] of Object.entries(services)) {
      expect(servico.healthcheck?.test, `${nome} sem healthcheck`).toBeDefined()
    }
  })

  it('o compose de teste só troca portas, e nenhuma coincide com a do ambiente de desenvolvimento', () => {
    const exemplo = lerAmbienteExemplo()
    const teste = parseEnv(lerArquivo('infra/teste.env'))
    expect(Object.keys(teste).length).toBeGreaterThan(0)
    for (const [chave, porta] of Object.entries(teste)) {
      expect(chave).toMatch(/_PORTA_HOST$/)
      expect(exemplo[chave], `${chave} não existe em .env.example`).toBeDefined()
      expect(porta).not.toBe(exemplo[chave])
    }
  })

  it('a raiz sobe com .env.example, e .env local fica fora do git', () => {
    const raiz = parse(lerArquivo('compose.yaml')) as { include: Array<{ path: string; env_file: string }> }
    expect(raiz.include).toEqual([{ path: 'infra/compose.yml', env_file: '.env.example' }])
    expect(lerArquivo('.gitignore').split('\n')).toContain('.env')
  })
})
