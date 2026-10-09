import { describe, expect, it } from 'vitest'
import {
  avisoDePrazoDoE2e,
  etapaDosTestesDoE2e,
  etapasDoE2e,
  fatiaDosArgumentos,
  limiarDosTestesEmMinutos,
  minutosEstimadosDoE2e,
} from './prazo-do-e2e.ts'

const MINUTO = 60_000

describe('prazo do e2e (tools/ci/prazo-do-e2e.ts)', () => {
  it('a conta reprova o job único que a esteira cancelou: 394 casos não cabem em 60% de 45 min, e um quarto deles cabe', () => {
    // 4 min fixos + 394 × 7 s = 49,97 min, arredondados para 50; a execução 37165931582 foi cancelada aos 45.
    expect(minutosEstimadosDoE2e(394)).toBe(50)
    expect(minutosEstimadosDoE2e(394)).toBeGreaterThan(45 * 0.6)
    expect(minutosEstimadosDoE2e(99)).toBe(16)
    expect(minutosEstimadosDoE2e(99)).toBeLessThanOrEqual(45 * 0.6)
  })

  it('o limiar dos testes é 60% do teto menos o custo fixo do job: 23 min num teto de 45', () => {
    expect(limiarDosTestesEmMinutos(45)).toBe(23)
  })

  it('avisa só quando os testes passam do limiar, com a duração e o caminho no runbook', () => {
    expect(avisoDePrazoDoE2e(23 * MINUTO, 45)).toBeNull()
    const aviso = avisoDePrazoDoE2e(23 * MINUTO + 1_000, 45)
    expect(aviso).toContain('23.0 min')
    expect(aviso).toContain('teto de 45 min')
    expect(aviso).toContain('docs/runbook.md')
    // O mesmo tempo num teto maior não avisa: o limiar acompanha o teto do workflow, e não é número fixo.
    expect(avisoDePrazoDoE2e(23 * MINUTO + 1_000, 60)).toBeNull()
  })

  it('a etapa dos testes leva a fatia ao Playwright e, passado o limiar, avisa como anotação na esteira e como linha na máquina', () => {
    const escritos: string[] = []
    const naEsteira = etapaDosTestesDoE2e('2/4', 45, true, (texto) => escritos.push(texto))
    expect([naEsteira.comando, ...naEsteira.argumentos]).toEqual(['npx', 'playwright', 'test', '--shard=2/4'])
    naEsteira.aoTerminar?.(0, 22 * MINUTO)
    expect(escritos).toEqual([])
    // Vermelha também avisa: a fatia lenta e falha é a que mais precisa do sinal.
    naEsteira.aoTerminar?.(1, 30 * MINUTO)
    expect(escritos).toHaveLength(1)
    expect(escritos[0]).toMatch(/^::warning title=e2e perto do teto::.*30\.0 min/)

    const naMaquina = etapaDosTestesDoE2e(null, 45, false, (texto) => escritos.push(texto))
    expect(naMaquina.argumentos).toEqual(['playwright', 'test'])
    naMaquina.aoTerminar?.(0, 30 * MINUTO)
    expect(escritos[1]).not.toContain('::warning')
    expect(escritos[1]).toContain('30.0 min')
  })

  it('as etapas que o ci:e2e roda levam a fatia ao Playwright, e a dos testes avisa o prazo; as outras não avisam', () => {
    const escritos: string[] = []
    const etapas = etapasDoE2e(['--manter-ambiente', '--shard=3/4'], 45, true, (texto) => escritos.push(texto))
    const testes = etapas.filter((etapa) => etapa.comando === 'npx' && etapa.argumentos[0] === 'playwright' && etapa.argumentos[1] === 'test')
    expect(testes).toHaveLength(1)
    expect(testes[0]?.argumentos).toEqual(['playwright', 'test', '--shard=3/4'])
    // A dos testes é a última: o prazo que se mede é o dela, não o da subida do compose.
    expect(etapas.at(-1)).toBe(testes[0])
    for (const etapa of etapas) etapa.aoTerminar?.(0, 30 * MINUTO)
    expect(escritos).toHaveLength(1)
    expect(escritos[0]).toMatch(/^::warning title=e2e perto do teto::/)

    // Na máquina, a mesma lista sem `--with-deps` e o aviso sem a sintaxe de anotação.
    const naMaquina = etapasDoE2e([], 45, false, (texto) => escritos.push(texto))
    naMaquina.at(-1)?.aoTerminar?.(0, 30 * MINUTO)
    expect(escritos[1]).not.toContain('::warning')
    expect(() => etapasDoE2e(['--shard=5/4'], 45, true)).toThrow(/fatia do e2e inválida/)
    // Com arquivos na linha de comando, o Playwright roda só eles: é o que o portão da tarefa usa. Opção não é arquivo.
    const filtrado = etapasDoE2e(['--manter-ambiente', 'e2e/privacidade.spec.ts', 'e2e/areas.spec.ts'], 45, false)
    expect(filtrado.at(-1)?.argumentos).toEqual(['playwright', 'test', 'e2e/privacidade.spec.ts', 'e2e/areas.spec.ts'])
    expect(naMaquina.at(-1)?.argumentos).toEqual(['playwright', 'test'])
    // O build que o teto mede é o do e2e, com a galeria das peças; nenhuma outra etapa leva a variável.
    expect(etapas.filter((etapa) => etapa.ambiente !== undefined).map((etapa) => [etapa.nome, etapa.ambiente])).toEqual([['build da web', { VITE_COM_GALERIA: '1' }]])
  })

  it('lê uma fatia só, no formato <i>/<n> com 1 ≤ i ≤ n; sem fatia é a suíte inteira', () => {
    expect(fatiaDosArgumentos([])).toBeNull()
    expect(fatiaDosArgumentos(['--manter-ambiente'])).toBeNull()
    expect(fatiaDosArgumentos(['--shard=3/4'])).toBe('3/4')
    expect(fatiaDosArgumentos(['--manter-ambiente', '--shard=1/1'])).toBe('1/1')
    for (const invalido of [['--shard=0/4'], ['--shard=5/4'], ['--shard=1/'], ['--shard', '2/4'], ['--shard=1/4', '--shard=2/4'], ['--shard=${{ matrix.fatia }}/4']]) {
      expect(() => fatiaDosArgumentos(invalido), invalido.join(' ')).toThrow(/fatia do e2e inválida/)
    }
  })
})
