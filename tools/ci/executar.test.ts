import { spawnSync } from 'node:child_process'
import { describe, expect, it } from 'vitest'
import { executarEtapas, raizRepositorio, type Etapa } from './executar.ts'

function sairCom(codigo: number, marcador = ''): Etapa {
  return { nome: `sai com ${codigo}`, comando: 'node', argumentos: ['-e', `${marcador}process.exit(${codigo})`] }
}

describe('executarEtapas', () => {
  it('devolve o código da primeira etapa que falhou e não roda as seguintes', async () => {
    const rodadas: number[] = []
    const codigo = await executarEtapas([sairCom(0), sairCom(3), sairCom(0)], (codigoFinal) => {
      rodadas.push(codigoFinal)
      return []
    })
    expect(codigo).toBe(3)
    expect(rodadas).toEqual([3])
  })

  it('finalização bem-sucedida não apaga a falha anterior', async () => {
    expect(await executarEtapas([sairCom(2)], () => [sairCom(0)])).toBe(2)
  })

  it('finalização que falha deixa vermelho o que estava verde', async () => {
    expect(await executarEtapas([sairCom(0)], () => [sairCom(5)])).toBe(5)
  })

  it('avisa o fim de cada etapa que rodou, verde ou vermelha, com o código e a duração dela; a que não rodou não avisa', async () => {
    const avisos: { nome: string; codigo: number; duracaoMs: number }[] = []
    const comAviso = (etapa: Etapa): Etapa => ({
      ...etapa,
      aoTerminar: (codigo, duracaoMs) => avisos.push({ nome: etapa.nome, codigo, duracaoMs }),
    })
    const lenta: Etapa = { nome: 'lenta', comando: 'node', argumentos: ['-e', 'setTimeout(() => process.exit(0), 300)'] }
    expect(await executarEtapas([comAviso(lenta), comAviso(sairCom(4)), comAviso(sairCom(0, '/*nao roda*/'))])).toBe(4)
    expect(avisos.map(({ nome, codigo }) => [nome, codigo])).toEqual([
      ['lenta', 0],
      ['sai com 4', 4],
    ])
    expect(avisos[0]?.duracaoMs).toBeGreaterThanOrEqual(300)
  })

  it('a etapa leva o ambiente dela ao processo, por cima do que já havia, e a etapa sem ambiente não o herda', async () => {
    const confere = (esperado: string): Etapa['argumentos'] => ['-e', `process.exit(process.env.EDUCA_ETAPA_DE_TESTE === ${JSON.stringify(esperado)} && process.env.PATH ? 0 : 3)`]
    expect(await executarEtapas([{ nome: 'com ambiente', comando: process.execPath, argumentos: confere('1'), ambiente: { EDUCA_ETAPA_DE_TESTE: '1' } }])).toBe(0)
    expect(await executarEtapas([{ nome: 'sem ambiente', comando: process.execPath, argumentos: confere('1') }])).toBe(3)
  })

  it('processo morto por sinal conta como falha', async () => {
    const morto: Etapa = { nome: 'morto', comando: 'node', argumentos: ['-e', 'process.kill(process.pid, "SIGKILL")'] }
    expect(await executarEtapas([morto])).not.toBe(0)
  })

  it('comando inexistente conta como falha', async () => {
    expect(await executarEtapas([{ nome: 'inexistente', comando: 'comando-que-nao-existe-educa', argumentos: [] }])).toBe(127)
  })

  it('script de esteira com teste de fixture vermelho sai com código diferente de zero e ainda finaliza', () => {
    const resultado = spawnSync('node', ['tools/ci/fixtures/esteira-com-teste-vermelho.ts'], {
      cwd: raizRepositorio,
      encoding: 'utf8',
      env: { ...process.env, CI: 'true', FORCE_COLOR: '0' },
    })
    expect(resultado.status).not.toBe(0)
    expect(resultado.stdout).toContain('falha de propósito')
    expect(resultado.stdout).not.toContain('ETAPA_SEGUINTE_RODOU')
    expect(resultado.stdout).toContain('FINALIZACAO_RODOU')
  }, 60_000)
})
