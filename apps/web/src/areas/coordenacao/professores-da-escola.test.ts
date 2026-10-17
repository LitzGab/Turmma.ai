import type { ProfessorDaEscola, VinculoDaCoordenacao } from '@educa/shared'
import { describe, expect, it } from 'vitest'
import { contagemDeProfessores, professorDoEndereco, professoresDaTabela } from './professores-da-escola'

/**
 * A conta que a aba Professores desenha (telas da coordenação, 6.0; RF13): as turmas e as disciplinas dos vínculos de cada professor,
 * o professor que o endereço abre e a contagem. Sem rede e sem tela: o que se prova é o que a linha diria.
 */

const id = (n: number) => `0197a1c0-0000-7000-8000-${String(n).padStart(12, '0')}`
const CAMILA: ProfessorDaEscola = { usuarioId: id(502), nome: 'Camila', estado: 'ativo' }
const RAFAEL: ProfessorDaEscola = { usuarioId: id(501), nome: 'Rafael', estado: 'pendente' }
const BEATRIZ: ProfessorDaEscola = { usuarioId: id(503), nome: 'Beatriz', estado: 'vencido' }
const TURMA = (n: number, nome: string) => ({ id: id(100 + n), nome })
const T7A = TURMA(1, '7ºA')
const T7B = TURMA(2, '7ºB')
const T10A = TURMA(3, '10ºA')
const MATEMATICA = { id: id(700), nome: 'Matemática' }
const FISICA = { id: id(701), nome: 'Física' }

const vinculo = (n: number, professor: ProfessorDaEscola, turma: { id: string; nome: string }, estado: VinculoDaCoordenacao['estado'], disciplina: { id: string; nome: string } | null = MATEMATICA): VinculoDaCoordenacao => ({
  id: id(600 + n),
  usuarioId: professor.usuarioId,
  papel: 'professor',
  turma,
  ...(disciplina === null ? {} : { disciplina }),
  estado,
})
const inteiros = (itens: readonly VinculoDaCoordenacao[]) => ({ itens, completa: true })
const daLinha = (professor: ProfessorDaEscola, vinculos: readonly VinculoDaCoordenacao[]) => {
  const linha = professoresDaTabela([professor], inteiros(vinculos))[0]
  if (linha === undefined) throw new Error('sem a linha')
  return linha
}

describe('professoresDaTabela: as turmas e as disciplinas de cada professor', () => {
  it('duas disciplinas na mesma turma: a turma uma vez, as duas disciplinas pelo nome', () => {
    const linha = daLinha(CAMILA, [vinculo(1, CAMILA, T7A, 'confirmado', MATEMATICA), vinculo(2, CAMILA, T7A, 'pendente', FISICA)])
    expect(linha.turmas).toEqual(['7ºA'])
    expect(linha.disciplinas).toEqual(['Física', 'Matemática'])
  })

  it('a mesma disciplina em duas turmas: as duas turmas, a disciplina uma vez', () => {
    const linha = daLinha(CAMILA, [vinculo(1, CAMILA, T7B, 'confirmado'), vinculo(2, CAMILA, T7A, 'confirmado')])
    expect(linha.turmas).toEqual(['7ºA', '7ºB'])
    expect(linha.disciplinas).toEqual(['Matemática'])
  })

  it('o vínculo pendente, o confirmado e o contestado contam; o encerrado já não é do professor', () => {
    const linha = daLinha(CAMILA, [
      vinculo(1, CAMILA, T7A, 'pendente', MATEMATICA),
      vinculo(2, CAMILA, T7B, 'confirmado', MATEMATICA),
      vinculo(3, CAMILA, T10A, 'contestado', FISICA),
      vinculo(4, CAMILA, TURMA(4, '8ºA'), 'encerrado', { id: id(702), nome: 'Química' }),
    ])
    expect(linha.turmas).toEqual(['7ºA', '7ºB', '10ºA'])
    expect(linha.disciplinas).toEqual(['Física', 'Matemática'])
  })

  it('a turma 10 vem depois da 7, e não da 1', () => {
    expect(daLinha(CAMILA, [vinculo(1, CAMILA, T10A, 'confirmado'), vinculo(2, CAMILA, T7A, 'confirmado')]).turmas).toEqual(['7ºA', '10ºA'])
  })

  it('o vínculo de cada professor é só dele, e o que não é de professor não entra', () => {
    const doAluno: VinculoDaCoordenacao = { ...vinculo(9, RAFAEL, T7B, 'confirmado'), papel: 'aluno' }
    const [camila, rafael] = professoresDaTabela([RAFAEL, CAMILA], inteiros([vinculo(1, CAMILA, T7A, 'confirmado'), doAluno]))
    expect([camila?.professor.nome, camila?.turmas]).toEqual(['Camila', ['7ºA']])
    expect([rafael?.professor.nome, rafael?.turmas]).toEqual(['Rafael', []])
  })

  it('o vínculo sem disciplina dá a turma e nenhuma disciplina', () => {
    const linha = daLinha(CAMILA, [vinculo(1, CAMILA, T7A, 'confirmado', null)])
    expect(linha.turmas).toEqual(['7ºA'])
    expect(linha.disciplinas).toEqual([])
  })

  it('o professor sem vínculo fica com as duas listas vazias, e a tela diz o traço', () => {
    const linha = daLinha(BEATRIZ, [vinculo(1, CAMILA, T7A, 'confirmado')])
    expect([linha.turmas, linha.disciplinas]).toEqual([[], []])
  })

  it('sem os vínculos lidos (carregando, erro, sem ano em curso), nenhum professor ganha turma', () => {
    const [linha] = professoresDaTabela([CAMILA], undefined)
    expect([linha?.turmas, linha?.disciplinas]).toEqual([[], []])
  })

  it('os professores saem pelo nome, e não pela ordem em que a API os entrega', () => {
    expect(professoresDaTabela([RAFAEL, CAMILA, BEATRIZ], inteiros([])).map((linha) => linha.professor.nome)).toEqual(['Beatriz', 'Camila', 'Rafael'])
  })
})

describe('professorDoEndereco: o professor que a consulta abre', () => {
  const lista = [CAMILA, RAFAEL]

  it('o id que está na lista abre aquele professor', () => {
    expect(professorDoEndereco(`professor=${CAMILA.usuarioId}`, lista)).toBe(CAMILA)
    expect(professorDoEndereco(`painel=ano&professor=${RAFAEL.usuarioId}`, lista)).toBe(RAFAEL)
  })

  it('o id que a lista não tem — de outra escola, inventado, vazio ou ausente — não abre nada', () => {
    expect(professorDoEndereco(`professor=${BEATRIZ.usuarioId}`, lista)).toBeUndefined()
    expect(professorDoEndereco('professor=nao-e-um-id', lista)).toBeUndefined()
    expect(professorDoEndereco('professor=', lista)).toBeUndefined()
    expect(professorDoEndereco('', lista)).toBeUndefined()
    expect(professorDoEndereco(`professor=${CAMILA.usuarioId}`, [])).toBeUndefined()
  })

  it('só o parâmetro `professor` abre: o id em outro parâmetro é ignorado', () => {
    expect(professorDoEndereco(`painel=${CAMILA.usuarioId}`, lista)).toBeUndefined()
  })
})

describe('contagemDeProfessores', () => {
  it.each([
    [1, '1 professor'],
    [2, '2 professores'],
    [31, '31 professores'],
  ] as const)('%i → %s', (quantos, esperado) => {
    expect(contagemDeProfessores(quantos)).toBe(esperado)
  })
})
