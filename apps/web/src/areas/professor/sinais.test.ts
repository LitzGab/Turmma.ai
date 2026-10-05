import type { Sinal } from '@educa/shared'
import { describe, expect, it } from 'vitest'
import * as textos from './sinais'
import { emQueEstava, falaDoGrupo, ondeFoi, separarSinais, textoDaAtencaoHumana, textoDoSinal, tituloDaAtencaoHumana, trocasDeHoje } from './sinais'

const id = (final: string) => `0190f5a0-0000-7000-8000-0000000000${final}`
const REFERENCIAS = { atividades: { [id('a1')]: 'Atividade — Estequiometria' }, materiais: { [id('b1')]: 'Química 2' } }
const aluno = { id: id('01'), nome: 'Aluno sintético 01' }

describe('os sinais do Tutor: só o trabalho, e onde', () => {
  it('o grupo é dito sem nome de ninguém, no singular e no plural', () => {
    expect(falaDoGrupo({ tipo: 'travou', atividadeAplicadaId: id('a1'), questao: 3, alunos: 8 }, REFERENCIAS)).toBe('8 alunos travaram na questão 3 de "Atividade — Estequiometria".')
    expect(falaDoGrupo({ tipo: 'resposta_pronta', atividadeAplicadaId: id('a1'), questao: 2, alunos: 1 }, REFERENCIAS)).toBe('1 aluno pediu a resposta pronta na questão 2 de "Atividade — Estequiometria".')
    // Os sinais de página de material vêm num grupo só, sem atividade: a tela diz que foi no material.
    expect(falaDoGrupo({ tipo: 'duvida_repetida', atividadeAplicadaId: null, questao: null, alunos: 3 }, REFERENCIAS)).toBe('3 alunos repetiram a mesma dúvida no material da turma.')
  })

  it('o sinal de um aluno diz o que aconteceu e onde: na questão da atividade, ou na página do material', () => {
    const base = { id: id('s1'), aluno, criadoEm: '2026-10-05T13:00:00.000Z' }
    expect(textoDoSinal({ ...base, tipo: 'travou', atividadeAplicadaId: id('a1'), questao: 3, materialId: null, pagina: null }, REFERENCIAS)).toBe('Travou na questão 3 de "Atividade — Estequiometria"')
    expect(textoDoSinal({ ...base, tipo: 'duvida_repetida', atividadeAplicadaId: null, questao: null, materialId: id('b1'), pagina: 142 }, REFERENCIAS)).toBe('Repetiu a mesma dúvida na página 142 de "Química 2"')
    expect(textoDoSinal({ ...base, tipo: 'resposta_pronta', atividadeAplicadaId: null, questao: null, materialId: null, pagina: null }, REFERENCIAS)).toBe('Pediu a resposta pronta')
  })

  it('a referência que a tela não conhece não vira "undefined"', () => {
    expect(ondeFoi({ atividadeAplicadaId: id('a9'), questao: 2, materialId: null, pagina: null }, REFERENCIAS)).toBe('na questão 2 de uma atividade')
    expect(ondeFoi({ atividadeAplicadaId: id('a9'), questao: null, materialId: null, pagina: null }, REFERENCIAS)).toBe('em uma atividade')
    expect(ondeFoi({ atividadeAplicadaId: id('a1'), questao: null, materialId: null, pagina: null }, REFERENCIAS)).toBe('em "Atividade — Estequiometria"')
    expect(ondeFoi({ atividadeAplicadaId: null, questao: null, materialId: id('b9'), pagina: null }, REFERENCIAS)).toBe('em "material da escola"')
  })

  it('D36: a atenção humana vem à parte, sem referência e sem conteúdo', () => {
    const sinais: Sinal[] = [
      { id: id('s1'), tipo: 'travou', aluno, atividadeAplicadaId: id('a1'), questao: 3, materialId: null, pagina: null, criadoEm: '2026-10-05T13:00:00.000Z' },
      { id: id('s2'), tipo: 'atencao_humana', aluno, criadoEm: '2026-10-05T13:05:00.000Z' },
    ]
    const { atencao, trabalho } = separarSinais(sinais)
    expect(atencao.map((sinal) => sinal.id)).toEqual([id('s2')])
    expect(trabalho.map((sinal) => sinal.id)).toEqual([id('s1')])
    // O sinal de atenção humana só tem quem e quando: o tipo nem tem onde guardar atividade, página ou texto.
    expect(Object.keys(atencao[0] ?? {}).sort()).toEqual(['aluno', 'criadoEm', 'id', 'tipo'])
  })

  it('o uso diz as trocas de hoje contra o limite e em que o aluno estava, sem contar tempo', () => {
    expect(trocasDeHoje({ trocasHoje: 12 }, 60)).toBe('12 de 60')
    expect(emQueEstava({ ultimaReferencia: { atividadeAplicadaId: id('a1'), questao: 4, materialId: null, pagina: null } }, REFERENCIAS)).toBe('Na questão 4 de "Atividade — Estequiometria"')
    expect(emQueEstava({ ultimaReferencia: { atividadeAplicadaId: null, questao: null, materialId: null, pagina: null } }, REFERENCIAS)).toBe('Sem atividade nem material')
  })

  it('regra 70, item 7: nenhum texto fixo fala em tempo parado, ociosidade, atenção, humor ou emoção do aluno', () => {
    const fixos = [...Object.values(textos).flatMap((valor) => (typeof valor === 'string' ? [valor] : [])), ...textos.QUANDO_O_TUTOR_AVISA, ...[1, 2].flatMap((quantos) => [tituloDaAtencaoHumana(quantos), textoDaAtencaoHumana(quantos)])]
    expect(fixos.length).toBeGreaterThanOrEqual(2)
    for (const texto of fixos) expect(texto).not.toMatch(/ocios|parado|distra|desatent|humor|triste|ansios|emoç/i)
  })
})

describe('o aviso de atenção humana (D36)', () => {
  it('fala de um aluno ou de vários, sem dizer o que foi dito', () => {
    expect(tituloDaAtencaoHumana(1)).toBe('Um aluno precisa de um adulto')
    expect(tituloDaAtencaoHumana(3)).toBe('3 alunos precisam de um adulto')
    expect(textoDaAtencaoHumana(1)).toContain('procure o aluno pessoalmente')
    expect(textoDaAtencaoHumana(2)).toContain('procure cada aluno pessoalmente')
    for (const quantos of [1, 2]) expect(textoDaAtencaoHumana(quantos)).toContain('O que foi dito não aparece aqui')
  })
})
