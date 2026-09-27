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

  // I9 da A1 (cenarios.md): cada célula nova com o alcance da seção 4 da Tech Spec. A comparação com a expectativa já
  // pega a célula trocada; este teste diz a regra de cada uma, e as tarefas seguintes da A1 acrescentam as delas.
  it('I9: renomear e excluir disciplina e turma são da coordenação, com `unidade`; professor, aluno e rede, `nunca`', () => {
    for (const recurso of ['disciplina', 'turma'] as const) {
      for (const acao of ['renomear', 'excluir'] as const) {
        expect(alcanceDe('coordenador', recurso, acao), `${recurso}.${acao}`).toBe('unidade')
        for (const papel of ['professor', 'aluno', 'rede'] as const) expect(alcanceDe(papel, recurso, acao), `${papel} ${recurso}.${acao}`).toBe('nunca')
      }
    }
  })

  it('I9: listar, cadastrar, refazer e revogar o convite de professor são da coordenação, com `unidade`; professor, aluno e rede, `nunca`', () => {
    expect(RECURSOS.professor).toEqual(['listar', 'cadastrar', 'refazer_convite', 'revogar_convite'])
    for (const acao of RECURSOS.professor) {
      expect(alcanceDe('coordenador', 'professor', acao), acao).toBe('unidade')
      for (const papel of ['professor', 'aluno', 'rede'] as const) expect(alcanceDe(papel, 'professor', acao), `${papel} professor.${acao}`).toBe('nunca')
    }
  })

  it('I9: a lista de nomes é só da coordenação: a leitura `nominal_auditado`, as escritas e a prévia `unidade`; professor, aluno e rede, `nunca`', () => {
    expect(RECURSOS.lista_nome).toEqual(['ler', 'previa', 'gravar', 'acrescentar', 'retirar'])
    expect(alcanceDe('coordenador', 'lista_nome', 'ler')).toBe('nominal_auditado')
    for (const acao of ['previa', 'gravar', 'acrescentar', 'retirar'] as const) expect(alcanceDe('coordenador', 'lista_nome', acao), acao).toBe('unidade')
    for (const acao of RECURSOS.lista_nome) {
      for (const papel of ['professor', 'aluno', 'rede'] as const) expect(alcanceDe(papel, 'lista_nome', acao), `${papel} lista_nome.${acao}`).toBe('nunca')
    }
  })

  it('I9: o acesso da turma é só do professor, com `turma_vinculada`; coordenação, aluno e rede, `nunca`', () => {
    expect(RECURSOS.acesso_turma).toEqual(['gerar', 'ler', 'revogar'])
    for (const acao of RECURSOS.acesso_turma) {
      expect(alcanceDe('professor', 'acesso_turma', acao), acao).toBe('turma_vinculada')
      for (const papel of ['coordenador', 'aluno', 'rede'] as const) expect(alcanceDe(papel, 'acesso_turma', acao), `${papel} acesso_turma.${acao}`).toBe('nunca')
    }
  })

  it('I9: os pedidos da turma são do professor com `turma_vinculada` e da coordenação, a leitura `nominal_auditado` e a decisão `unidade`; aluno e rede, `nunca`', () => {
    expect(RECURSOS.reivindicacao).toEqual(['ler', 'decidir'])
    for (const acao of RECURSOS.reivindicacao) expect(alcanceDe('professor', 'reivindicacao', acao), acao).toBe('turma_vinculada')
    expect(alcanceDe('coordenador', 'reivindicacao', 'ler')).toBe('nominal_auditado')
    expect(alcanceDe('coordenador', 'reivindicacao', 'decidir')).toBe('unidade')
    for (const acao of RECURSOS.reivindicacao) {
      for (const papel of ['aluno', 'rede'] as const) expect(alcanceDe(papel, 'reivindicacao', acao), `${papel} reivindicacao.${acao}`).toBe('nunca')
    }
  })

  it('I9: `minha_turma` é só do aluno, com `proprio`, e é a única célula nova da A1 aberta a ele; coordenação, professor e rede, `nunca`', () => {
    expect(RECURSOS.minha_turma).toEqual(['ler'])
    expect(alcanceDe('aluno', 'minha_turma', 'ler')).toBe('proprio')
    for (const papel of ['coordenador', 'professor', 'rede'] as const) expect(alcanceDe(papel, 'minha_turma', 'ler'), papel).toBe('nunca')
    const recursosDaA1 = ['disciplina', 'turma', 'lista_nome', 'acesso_turma', 'professor', 'reivindicacao', 'minha_turma'] as const
    const abertasAoAluno = recursosDaA1.flatMap((recurso) =>
      Object.entries(MATRIZ.aluno[recurso])
        .filter(([, alcance]) => alcance !== 'nunca')
        .map(([acao]) => `${recurso}.${acao}`),
    )
    expect(abertasAoAluno).toEqual(['minha_turma.ler'])
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
