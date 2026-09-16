import { describe, expect, it } from 'vitest'
import { EXPECTATIVA_DA_MATRIZ } from './matriz.expectativa.js'
import { ALCANCES, ALCANCES_INDIVIDUAIS, alcanceDe, MATRIZ, PAPEIS, RECURSOS, type Alcance } from './matriz.js'

/** Toda célula da matriz, como a expectativa as escreve. */
function celulasDa(matriz: Readonly<Record<string, Readonly<Record<string, Readonly<Record<string, string>>>>>>): string[] {
  return Object.entries(matriz).flatMap(([papel, recursos]) =>
    Object.entries(recursos).flatMap(([recurso, acoes]) => Object.entries(acoes).map(([acao, alcance]) => `${papel}|${recurso}|${acao}|${alcance}`)),
  )
}

const expectativa = EXPECTATIVA_DA_MATRIZ.map((linha) => linha.join('|'))

describe('MATRIZ de permissão', () => {
  it('cada célula da matriz está na expectativa escrita à mão, e cada linha da expectativa está na matriz', () => {
    expect(new Set(expectativa).size).toBe(expectativa.length)
    expect([...celulasDa(MATRIZ)].sort()).toEqual([...expectativa].sort())
  })

  it('a matriz cobre todo papel × recurso × ação, e só com alcance conhecido', () => {
    const total = Object.values(RECURSOS).reduce((soma, acoes) => soma + acoes.length, 0) * PAPEIS.length
    expect(celulasDa(MATRIZ)).toHaveLength(total)
    for (const celula of celulasDa(MATRIZ)) expect(ALCANCES, celula).toContain(celula.split('|')[3])
  })

  it('a comparação pega uma célula trocada: a mesma matriz com um alcance diferente não bate com a expectativa', () => {
    const trocada = JSON.parse(JSON.stringify(MATRIZ)) as Record<string, Record<string, Record<string, string>>>
    const doProfessor = trocada['professor']?.['aluno_da_turma']
    if (doProfessor === undefined) throw new Error('célula ausente')
    doProfessor['ler'] = 'unidade'
    expect([...celulasDa(trocada)].sort()).not.toEqual([...expectativa].sort())
  })

  it('a rede nunca tem alcance individual: só nunca ou agregado, em toda célula', () => {
    const daRede = Object.values(MATRIZ.rede).flatMap((acoes) => Object.values(acoes) as Alcance[])
    expect(daRede.length).toBeGreaterThan(0)
    for (const alcance of daRede) expect(['nunca', 'agregado']).toContain(alcance)
    for (const individual of ALCANCES_INDIVIDUAIS) expect(daRede).not.toContain(individual)
  })

  it('indicador de professor segue a regra 70, item 8: o próprio para ele, agregado e nominal com auditoria para a coordenação, agregado para a rede', () => {
    expect(MATRIZ.professor.indicador_professor).toEqual({ ler_agregado: 'nunca', ler_nominal: 'proprio' })
    expect(MATRIZ.coordenador.indicador_professor).toEqual({ ler_agregado: 'agregado', ler_nominal: 'nominal_auditado' })
    expect(MATRIZ.rede.indicador_professor).toEqual({ ler_agregado: 'agregado', ler_nominal: 'nunca' })
    expect(MATRIZ.aluno.indicador_professor).toEqual({ ler_agregado: 'nunca', ler_nominal: 'nunca' })
    // A coordenação nunca lê o nominal sem auditoria: nenhuma célula dela dá ao indicador `unidade`, `proprio` ou `turma_vinculada`.
    for (const semAuditoria of ['unidade', 'proprio', 'turma_vinculada']) expect(Object.values(MATRIZ.coordenador.indicador_professor)).not.toContain(semAuditoria)
  })

  it('o aluno só alcança a si: toda célula dele é proprio ou nunca', () => {
    const doAluno = Object.values(MATRIZ.aluno).flatMap((acoes) => Object.values(acoes) as Alcance[])
    expect(doAluno.length).toBeGreaterThan(0)
    for (const alcance of doAluno) expect(['proprio', 'nunca']).toContain(alcance)
  })

  it('o vínculo é definido pela escola e só confirmado pelo professor (regra 60, item 8a)', () => {
    expect(MATRIZ.professor.vinculo.criar).toBe('nunca')
    expect(MATRIZ.professor.vinculo.encerrar).toBe('nunca')
    expect(MATRIZ.coordenador.vinculo.confirmar).toBe('nunca')
  })

  it('alcanceDe devolve a célula, e nunca para papel, recurso ou ação que a matriz não declara', () => {
    expect(alcanceDe('professor', 'turma', 'ler')).toBe('turma_vinculada')
    expect(alcanceDe('responsavel', 'turma', 'ler')).toBe('nunca')
    expect(alcanceDe('coordenador', 'nota', 'ler')).toBe('nunca')
    expect(alcanceDe('coordenador', 'turma', 'apagar')).toBe('nunca')
    expect(alcanceDe('coordenador', 'toString', 'ler')).toBe('nunca')
    expect(alcanceDe('__proto__', 'turma', 'ler')).toBe('nunca')
    expect(alcanceDe('coordenador', 'turma', 'constructor')).toBe('nunca')
  })
})
