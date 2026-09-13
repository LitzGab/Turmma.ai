import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { composeOuFalha } from '../testes/compose.ts'
import { lerAmbienteDeTeste, valorObrigatorio } from './compose.ts'
import { raizRepositorio } from './executar.ts'

/** Ambiente mínimo, sem nenhuma variável do projeto herdada do shell de quem roda. */
function ambienteLimpo(): Record<string, string> {
  const ambiente: Record<string, string> = {}
  for (const chave of ['PATH', 'HOME', 'DOCKER_HOST', 'DOCKER_CONFIG', 'DOCKER_CONTEXT']) {
    const valor = process.env[chave]
    if (valor !== undefined) ambiente[chave] = valor
  }
  return ambiente
}

function dockerLimpo(argumentos: string[]) {
  return spawnSync('docker', argumentos, { cwd: raizRepositorio, env: ambienteLimpo(), encoding: 'utf8' })
}

interface PortaPublicada {
  host_ip?: string
  published?: string
}

describe('ambiente do compose', () => {
  it('sobe só com .env.example: sem ele o compose recusa, com ele resolve tudo', () => {
    expect(existsSync(join(raizRepositorio, 'infra', '.env'))).toBe(false)
    expect(dockerLimpo(['compose', '-f', 'infra/compose.yml', 'config', '--quiet']).status).not.toBe(0)
    const comExemplo = dockerLimpo(['compose', '--env-file', '.env.example', '-f', 'infra/compose.yml', 'config', '--quiet'])
    expect(comExemplo.stderr).toBe('')
    expect(comExemplo.status).toBe(0)
  })

  it('`docker compose up` na raiz resolve a configuração só com os arquivos versionados', () => {
    const raiz = dockerLimpo(['compose', 'config', '--quiet'])
    expect(raiz.stderr).toBe('')
    expect(raiz.status).toBe(0)
  })

  it('toda porta publicada, de todos os serviços, escuta só no loopback da máquina', () => {
    const configuracao = JSON.parse(composeOuFalha('config', '--format', 'json')) as {
      services: Record<string, { ports?: PortaPublicada[] }>
    }
    const portas = Object.values(configuracao.services).flatMap((servico) => servico.ports ?? [])
    // Todo serviço com HTTP publica uma porta; migrar, despachante e worker não atendem ninguém e não publicam.
    const semPorta = ['migrar', 'despachante-1', 'despachante-2', 'worker-interativo-1', 'worker-interativo-2', 'worker-lote-1', 'worker-lote-2']
    expect(portas.length).toBe(Object.keys(configuracao.services).length - semPorta.length)
    for (const nome of semPorta) expect(configuracao.services[nome]?.ports, nome).toBeUndefined()
    for (const porta of portas) {
      expect(porta.host_ip).toBe('127.0.0.1')
    }
  })

  it('Redis de fila não expulsa chave e persiste em AOF; Redis de cache expulsa por LRU', () => {
    const politicaFila = composeOuFalha('exec', '-T', 'redis-fila', 'redis-cli', 'config', 'get', 'maxmemory-policy')
    const aofFila = composeOuFalha('exec', '-T', 'redis-fila', 'redis-cli', 'config', 'get', 'appendonly')
    const politicaCache = composeOuFalha('exec', '-T', 'redis-cache', 'redis-cli', 'config', 'get', 'maxmemory-policy')
    expect(politicaFila).toContain('noeviction')
    expect(aofFila).toMatch(/appendonly\s+yes/)
    expect(politicaCache).toContain('allkeys-lru')
  })

  it('a soma dos pools de todas as instâncias que usam o Postgres cabe no max_connections, com folga para operação', () => {
    const ambiente = lerAmbienteDeTeste()
    const configuracao = JSON.parse(composeOuFalha('config', '--format', 'json')) as {
      services: Record<string, { environment?: Record<string, string | null> }>
    }
    const comPool = Object.entries(configuracao.services).flatMap(([nome, servico]) => {
      const maximo = servico.environment?.['BANCO_POOL_MAXIMO']
      return maximo === undefined || maximo === null ? [] : [{ nome, maximo: Number(maximo) }]
    })
    // Todo processo com pool entra na soma: as duas APIs, os dois despachantes (com o LISTEN dentro do pool) e os quatro workers.
    expect(comPool.map(({ nome }) => nome).sort()).toEqual([
      'api-1',
      'api-2',
      'despachante-1',
      'despachante-2',
      'worker-interativo-1',
      'worker-interativo-2',
      'worker-lote-1',
      'worker-lote-2',
    ])
    const pools = comPool.map(({ maximo }) => maximo)
    const consultar = (sql: string) =>
      Number(
        composeOuFalha(
          'exec', '-T', 'postgres', 'psql', '-U', valorObrigatorio(ambiente, 'POSTGRES_USUARIO'),
          '-d', valorObrigatorio(ambiente, 'POSTGRES_BANCO'), '-tAc', sql,
        ).trim(),
      )
    const disponiveis = consultar('show max_connections') - consultar('show superuser_reserved_connections')
    // O serviço migrar e o psql de operação abrem conexão fora dos pools.
    const FOLGA_PARA_OPERACAO = 10
    expect(pools.reduce((soma, maximo) => soma + maximo, 0) + FOLGA_PARA_OPERACAO).toBeLessThanOrEqual(disponiveis)
  })

  it('Postgres tem pgvector disponível', () => {
    const ambiente = lerAmbienteDeTeste()
    const saida = composeOuFalha(
      'exec', '-T', 'postgres', 'psql', '-U', valorObrigatorio(ambiente, 'POSTGRES_USUARIO'),
      '-d', valorObrigatorio(ambiente, 'POSTGRES_BANCO'), '-tAc',
      "select count(*) from pg_available_extensions where name = 'vector'",
    )
    expect(saida.trim()).toBe('1')
  })

  it('storage grava e lê com a credencial S3, e recusa quem não assina: bucket nunca é público', async () => {
    const ambiente = lerAmbienteDeTeste()
    const objeto = `http://127.0.0.1:${valorObrigatorio(ambiente, 'STORAGE_PORTA_HOST')}/${valorObrigatorio(ambiente, 'STORAGE_BUCKET')}/fumaca-${Date.now()}.txt`
    const credencial = `${valorObrigatorio(ambiente, 'STORAGE_CHAVE_ACESSO')}:${valorObrigatorio(ambiente, 'STORAGE_CHAVE_SECRETA')}`
    const assinado = (...argumentos: string[]) =>
      spawnSync('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}', '--aws-sigv4', 'aws:amz:us-east-1:s3', '--user', credencial, ...argumentos], {
        encoding: 'utf8',
      }).stdout

    expect(assinado('-X', 'PUT', '--data-binary', 'sintetico', objeto)).toBe('200')
    expect(assinado(objeto)).toBe('200')
    expect((await fetch(objeto)).status).toBe(403)
    expect((await fetch(objeto, { method: 'PUT', body: 'x' })).status).toBe(403)
    expect(assinado('-X', 'DELETE', objeto)).toBe('204')
  })
})
