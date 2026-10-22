import type { Turma, VinculoDaCoordenacao } from '@educa/shared'
import { describe, expect, it } from 'vitest'
import {
  agruparPorSerie,
  NOME_NAO_CARREGADO,
  painelDoEndereco,
  situacaoDoEndereco,
  turmasDaTabela,
  type VinculosLidos,
} from './turmas-da-escola'

/**
 * A conta que a aba Turmas desenha (telas da coordenação, 5.0; RF11): as turmas por série, os professores de cada uma e a marca
 * "Sem professor", que sai da mesma conta do sino. Sem rede e sem tela: o que se prova é o que a linha diria.
 */

const id = (n: number) => `0197a1c0-0000-7000-8000-${String(n).padStart(12, '0')}`
const ANO = id(1)
const SERIE_7 = { id: id(207), etapa: 'ef_anos_finais', ano: 7 } as const
const SERIE_8 = { id: id(208), etapa: 'ef_anos_finais', ano: 8 } as const
const SERIE_1_EM = { id: id(301), etapa: 'em', ano: 1 } as const
const turma = (n: number, nome: string, serie: Turma['serie']): Turma => ({ id: id(100 + n), anoLetivoId: ANO, nome, turno: null, serie })
const T7A = turma(1, '7ºA', SERIE_7)
const T7B = turma(2, '7ºB', SERIE_7)
const T8A = turma(3, '8ºA', SERIE_8)
const T1EM = turma(4, '1ºA', SERIE_1_EM)

const NOMES: Readonly<Record<string, string>> = { [id(501)]: 'Rafael', [id(502)]: 'Camila', [id(503)]: 'Beatriz', [id(504)]: 'Davi' }
const nomeDe = (usuarioId: string) => NOMES[usuarioId] ?? NOME_NAO_CARREGADO

const vinculo = (n: number, professor: number, alvo: Turma, estado: VinculoDaCoordenacao['estado'], disciplina = 'Matemática'): VinculoDaCoordenacao => ({
  id: id(600 + n),
  usuarioId: id(500 + professor),
  papel: 'professor',
  turma: { id: alvo.id, nome: alvo.nome },
  disciplina: { id: id(700), nome: disciplina },
  estado,
})
const inteiros = (itens: readonly VinculoDaCoordenacao[]): VinculosLidos => ({ itens, completa: true })

describe('turmasDaTabela: os professores de cada turma', () => {
  it('conta o vínculo pendente e o confirmado, pelo nome; o contestado e o encerrado não dão professor', () => {
    const [linha] = turmasDaTabela(
      [T7A],
      inteiros([vinculo(1, 1, T7A, 'confirmado'), vinculo(2, 2, T7A, 'pendente'), vinculo(3, 3, T7A, 'contestado'), vinculo(4, 4, T7A, 'encerrado')]),
      nomeDe,
    )
    expect(linha?.professores).toEqual(['Camila', 'Rafael'])
    expect(linha?.semProfessor).toBe(false)
  })

  it('a turma sem vínculo, a só com vínculo contestado e a só com vínculo encerrado estão sem professor', () => {
    const linhas = turmasDaTabela([T7A, T7B, T8A], inteiros([vinculo(1, 1, T7B, 'contestado'), vinculo(2, 2, T8A, 'encerrado')]), nomeDe)
    expect(linhas.map((linha) => [linha.turma.nome, linha.professores, linha.semProfessor])).toEqual([
      ['7ºA', [], true],
      ['7ºB', [], true],
      ['8ºA', [], true],
    ])
  })

  it('o professor com duas disciplinas na mesma turma aparece uma vez, e a turma continua com professor', () => {
    const [linha] = turmasDaTabela([T7A], inteiros([vinculo(1, 1, T7A, 'confirmado', 'Matemática'), vinculo(2, 1, T7A, 'pendente', 'Física')]), nomeDe)
    expect(linha?.professores).toEqual(['Rafael'])
  })

  it('dois professores com o mesmo nome são dois professores', () => {
    const igual = (usuarioId: string) => (usuarioId === id(501) || usuarioId === id(502) ? 'Camila' : NOME_NAO_CARREGADO)
    const [linha] = turmasDaTabela([T7A], inteiros([vinculo(1, 1, T7A, 'confirmado'), vinculo(2, 2, T7A, 'confirmado')]), igual)
    expect(linha?.professores).toEqual(['Camila', 'Camila'])
  })

  it('o vínculo de aluno e o de outra turma não entram', () => {
    const deAluno: VinculoDaCoordenacao = { ...vinculo(1, 1, T7A, 'confirmado'), papel: 'aluno' }
    const linhas = turmasDaTabela([T7A, T7B], inteiros([deAluno, vinculo(2, 2, T7B, 'confirmado')]), nomeDe)
    expect(linhas.map((linha) => linha.professores)).toEqual([[], ['Camila']])
    expect(linhas[0]?.semProfessor).toBe(true)
  })

  it('o professor que a lista de professores não trouxe aparece como "Nome não carregado"', () => {
    const [linha] = turmasDaTabela([T7A], inteiros([{ ...vinculo(1, 1, T7A, 'confirmado'), usuarioId: id(999) }]), nomeDe)
    expect(linha?.professores).toEqual([NOME_NAO_CARREGADO])
  })

  it('a marca é a mesma conta do sino: bate com `turmasSemProfessor` para qualquer mistura de estados', () => {
    const vinculos = [vinculo(1, 1, T7A, 'confirmado'), vinculo(2, 2, T7B, 'contestado'), vinculo(3, 3, T8A, 'pendente')]
    const marcadas = turmasDaTabela([T7A, T7B, T8A, T1EM], inteiros(vinculos), nomeDe)
      .filter((linha) => linha.semProfessor === true)
      .map((linha) => linha.turma.nome)
    expect(marcadas).toEqual(['7ºB', '1ºA'])
  })

  it('sem os vínculos inteiros, a turma sem professor à vista fica sem marca; a que tem professor à vista não está sem professor', () => {
    const truncados: VinculosLidos = { itens: [vinculo(1, 1, T7A, 'confirmado')], completa: false }
    const linhas = turmasDaTabela([T7A, T7B], truncados, nomeDe)
    expect(linhas.map((linha) => linha.semProfessor)).toEqual([false, undefined])
  })

  it('sem vínculo nenhum lido (carregando ou erro), nenhuma turma é dada como sem professor', () => {
    expect(turmasDaTabela([T7A, T7B], undefined, nomeDe).map((linha) => linha.semProfessor)).toEqual([undefined, undefined])
  })
})

describe('agruparPorSerie', () => {
  it('agrupa na ordem da escola, anos finais e depois Ensino Médio, e dentro da série pelo nome, não pela ordem de chegada', () => {
    const chegada = turmasDaTabela([T1EM, T8A, T7B, T7A], inteiros([]), nomeDe)
    const grupos = agruparPorSerie(chegada)
    expect(grupos.map((grupo) => [grupo.serie.id, grupo.turmas.map((linha) => linha.turma.nome)])).toEqual([
      [SERIE_7.id, ['7ºA', '7ºB']],
      [SERIE_8.id, ['8ºA']],
      [SERIE_1_EM.id, ['1ºA']],
    ])
  })

  it('a turma 10 vem depois da 9, e não da 1', () => {
    const t9 = turma(5, '7º9', SERIE_7)
    const t10 = turma(6, '7º10', SERIE_7)
    const [grupo] = agruparPorSerie(turmasDaTabela([t10, t9], inteiros([]), nomeDe))
    expect(grupo?.turmas.map((linha) => linha.turma.nome)).toEqual(['7º9', '7º10'])
  })

  it('sem turma, sem grupo', () => {
    expect(agruparPorSerie([])).toEqual([])
  })
})

describe('o endereço da Estrutura', () => {
  it('o painel é de lista fechada: valor desconhecido é ignorado', () => {
    expect(painelDoEndereco('painel=ano')).toBe('ano')
    expect(painelDoEndereco('painel=falta')).toBe('falta')
    expect(painelDoEndereco('painel=roteiro')).toBeUndefined()
    expect(painelDoEndereco('painel=')).toBeUndefined()
    expect(painelDoEndereco('')).toBeUndefined()
  })

  it('a situação é "sem-professor" ou todas, e valor desconhecido são todas', () => {
    expect(situacaoDoEndereco('situacao=sem-professor')).toBe('sem-professor')
    expect(situacaoDoEndereco('situacao=sem-lista')).toBe('todas')
    expect(situacaoDoEndereco('')).toBe('todas')
  })
})
