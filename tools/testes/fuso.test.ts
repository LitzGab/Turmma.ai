import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { parseEnv } from 'node:util'
import { describe, expect, it } from 'vitest'
import { parse } from 'yaml'
import { raizRepositorio } from '../ci/executar.ts'

/**
 * O fuso do ambiente de teste (correção `2026-10-12-fuso-nos-testes`; F3, retro, M2).
 *
 * Teste que lê o dia ou a hora do computador passa por acaso no computador em São Paulo (-03) e fica vermelho na esteira
 * (UTC) ou depois das 21 h. A unidade roda, por isso, num fuso longe de -03, e o Postgres de teste declara o da escola em
 * vez de herdar o do contêiner. Este arquivo prova a unidade; o banco vivo é provado em `fuso.int.test.ts`.
 */

const lerArquivo = (caminho: string) => readFileSync(join(raizRepositorio, caminho), 'utf8')

describe('o fuso do ambiente de teste', () => {
  it('a unidade roda em Asia/Tokyo, longe do -03 da escola: o teste que lê o fuso do computador deixa de passar por acaso', () => {
    // Sem a declaração em `vitest.config.ts`, o computador de quem roda decide: -03 na máquina do Joaquim, UTC na esteira.
    expect(Intl.DateTimeFormat().resolvedOptions().timeZone).toBe('Asia/Tokyo')
    const instante = new Date('2026-10-10T01:00:00Z')
    expect(instante.getTimezoneOffset()).toBe(-540)
    // 01 h de UTC é 10 h do dia 10 em Tóquio e 22 h do dia 9 em São Paulo: o dia do computador não é o da escola.
    expect(instante.getDate()).toBe(10)
  })

  it('o Postgres do compose declara o fuso da escola na linha de comando, com o valor do .env.example', () => {
    const { services } = parse(lerArquivo('infra/compose.yml'), { merge: true }) as { services: { postgres: { command: string[] } } }
    const comando = services.postgres.command
    const posicao = comando.findIndex((argumento) => argumento.startsWith('timezone='))
    // Por linha de comando, e não pelo `TZ` do contêiner: o porquê está no comentário do `postgres` em `infra/compose.yml`.
    expect(posicao).toBeGreaterThan(0)
    expect(comando[posicao - 1]).toBe('-c')
    expect(comando[posicao]).toMatch(/^timezone=\$\{POSTGRES_FUSO(:\?[^}]*)?\}$/)
    const exemplo = parseEnv(lerArquivo('.env.example'))
    expect(exemplo['POSTGRES_FUSO']).toBe('America/Sao_Paulo')
  })
})
