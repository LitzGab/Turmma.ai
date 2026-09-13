import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseEnv } from 'node:util'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { COMANDO_HEALTHCHECK_BATIMENTO } from '../../packages/nucleo/src/instancia/batimento.ts'
import { lerAmbienteExemplo } from './compose.ts'
import { raizRepositorio } from './executar.ts'

const lerArquivo = (caminho: string) => readFileSync(join(raizRepositorio, caminho), 'utf8')

interface Servico {
  healthcheck?: { test?: unknown }
  restart?: string
  depends_on?: Record<string, { condition?: string }>
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
    // O serviço que roda uma vez e sai (migrar) não tem healthcheck: quem depende dele espera o término com sucesso.
    const deUmaVez = new Set(
      Object.values(services).flatMap((servico) =>
        Object.entries(servico.depends_on ?? {})
          .filter(([, dependencia]) => dependencia.condition === 'service_completed_successfully')
          .map(([nome]) => nome),
      ),
    )
    for (const [nome, servico] of Object.entries(services)) {
      if (deUmaVez.has(nome)) {
        expect(servico.restart, `${nome} roda uma vez e não pode reiniciar`).toBe('no')
        continue
      }
      expect(servico.healthcheck?.test, `${nome} sem healthcheck`).toBeDefined()
    }
  })

  it('despachante e worker, sem HTTP, usam o healthcheck do batimento com a mesma idade máxima do código', () => {
    const { services } = parse(lerArquivo('infra/compose.yml'), { merge: true }) as { services: Record<string, Servico> }
    for (const nome of ['despachante-1', 'despachante-2', 'worker-1', 'worker-2']) {
      expect(services[nome]?.healthcheck?.test, nome).toEqual(['CMD', 'node', '-e', COMANDO_HEALTHCHECK_BATIMENTO])
    }
  })

  it('migrar roda antes de toda instância que usa o banco', () => {
    const { services } = parse(lerArquivo('infra/compose.yml'), { merge: true }) as {
      services: Record<string, Servico & { environment?: Record<string, string> }>
    }
    const usamOBanco = Object.entries(services).filter(([nome, servico]) => nome !== 'migrar' && servico.environment?.['BANCO_URL'] !== undefined)
    expect(usamOBanco.map(([nome]) => nome).sort()).toEqual(['api-1', 'api-2', 'despachante-1', 'despachante-2', 'worker-1', 'worker-2'])
    for (const [nome, servico] of usamOBanco) {
      expect(servico.depends_on?.['migrar']?.condition, nome).toBe('service_completed_successfully')
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
