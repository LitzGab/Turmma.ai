import { describe, expect, it } from 'vitest'
import * as textos from './aprovar'
import { acertosDoAluno, contadorDosDestaques, estadoDoDestaque, explicacoesDoDestaque, semCorrecao, letraDaAlternativa, motivosDoDestaque, resumoDoLote, rotuloDaFaixa, rotuloDeAprovar, situacaoDaAplicacao, textoDaMedia, textoDosCorrigidos } from './aprovar'

const id = (final: string) => `0190f5a0-0000-7000-8000-0000000000${final}`
const destaque = (final: string, abertoEm: string | null = null) => ({ alunoId: id(final), nome: `Aluno sintético ${final}`, acertos: 1, total: 5, emBranco: 0, motivos: ['fora_do_historico' as const], abertoEm })
const RESUMO = { alunosDaTurma: 32, corrigidos: 28, questoes: 5, mediaDeAcertos: 3.42, distribuicao: [], porHabilidade: [], porQuestao: [] }

describe('aprovar a correção: o contador que diz por que o botão está desligado (D33)', () => {
  it('com destaque sem abrir, diz quantos faltam, no singular e no plural', () => {
    expect(contadorDosDestaques({ destaques: [destaque('01', '2026-10-05T13:38:00.000Z'), destaque('02'), destaque('03')], destaquesAbertos: 1, podeAprovar: false })).toEqual({
      texto: '1 de 3 destaques abertos',
      porQue: 'Abra os 2 destaques que faltam para liberar a aprovação.',
    })
    expect(contadorDosDestaques({ destaques: [destaque('01')], destaquesAbertos: 0, podeAprovar: false })).toEqual({ texto: '0 de 1 destaque aberto', porQue: 'Abra o destaque que falta para liberar a aprovação.' })
  })

  it('com todos abertos e a API liberando, não há por quê; sem destaque nenhum, a tela diz isso', () => {
    expect(contadorDosDestaques({ destaques: [destaque('01', '2026-10-05T13:38:00.000Z')], destaquesAbertos: 1, podeAprovar: true })).toEqual({ texto: '1 de 1 destaque aberto', porQue: undefined })
    expect(contadorDosDestaques({ destaques: [], destaquesAbertos: 0, podeAprovar: true })).toEqual({ texto: 'Nenhuma correção destacada neste lote', porQue: undefined })
  })

  it('quem libera o botão é a API: com todos abertos e a API ainda recusando, a tela não libera por conta própria', () => {
    expect(contadorDosDestaques({ destaques: [destaque('01', '2026-10-05T13:38:00.000Z')], destaquesAbertos: 1, podeAprovar: false }).porQue).toBe('A aprovação ainda não foi liberada. Atualize a tela.')
  })

  it('o destaque fechado diz que falta abrir; o aberto, a hora em que foi aberto', () => {
    expect(estadoDoDestaque(destaque('01'))).toEqual({ aberto: false, texto: 'Falta abrir' })
    expect(estadoDoDestaque(destaque('01', '2026-10-05T13:38:00.000Z'), { fuso: 'America/Sao_Paulo', agora: new Date('2026-10-05T14:00:00.000Z') })).toEqual({ aberto: true, texto: 'Aberto · 05/10, 10h38' })
  })
})

describe('aprovar a correção: os textos', () => {
  it('a média é de acertos, em questões, e a contagem diz de quantos alunos', () => {
    expect(textoDaMedia(RESUMO)).toBe('3,4 de 5 questões')
    expect(textoDaMedia({ mediaDeAcertos: 1, questoes: 1 })).toBe('1 de 1 questão')
    expect(textoDosCorrigidos(RESUMO)).toBe('28 alunos responderam · 32 na turma hoje')
    // Depois de uma transferência, quem respondeu pode ser mais que a turma de hoje: a tela não vira fração impossível.
    expect(textoDosCorrigidos({ corrigidos: 5, alunosDaTurma: 4 })).toBe('5 alunos responderam · 4 na turma hoje')
    expect(textoDosCorrigidos({ corrigidos: 1, alunosDaTurma: 30 })).toBe('1 aluno respondeu · 30 na turma hoje')
    expect(rotuloDeAprovar(28)).toBe('Aprovar 28 correções')
    expect(rotuloDeAprovar(1)).toBe('Aprovar 1 correção')
  })

  it('a faixa, os motivos do destaque, os acertos do aluno e a letra da alternativa', () => {
    expect([{ de: 0, ate: 1 }, { de: 1, ate: 1 }, { de: 2, ate: 2 }, { de: 4, ate: 5 }].map(rotuloDaFaixa)).toEqual(['0 a 1 acertos', '1 acerto', '2 acertos', '4 a 5 acertos'])
    expect(motivosDoDestaque({ motivos: ['em_branco', 'padrao_de_erro'] })).toBe('Em branco · Padrão de erro para conferir')
    expect(acertosDoAluno({ acertos: 2, total: 5, emBranco: 0 })).toBe('2 de 5 acertos')
    expect(acertosDoAluno({ acertos: 0, total: 5, emBranco: 5 })).toBe('0 de 5 acertos · 5 em branco')
    expect([0, 3, null].map(letraDaAlternativa)).toEqual(['a', 'd', '—'])
  })

  it('o diálogo de aprovar diz a atividade, a turma, quantas correções e os destaques abertos', () => {
    expect(resumoDoLote({ titulo: 'Atividade — Estequiometria', resumo: RESUMO, destaques: [destaque('01', '2026-10-05T13:38:00.000Z')], destaquesAbertos: 1 }, '2ºB')).toEqual([
      { rotulo: 'Atividade', valor: 'Atividade — Estequiometria' },
      { rotulo: 'Turma', valor: '2ºB' },
      { rotulo: 'Correções', valor: '28 alunos responderam · 32 na turma hoje' },
      { rotulo: 'Destaques abertos', valor: '1 de 1' },
    ])
  })

  it('a atividade aplicada diz se está aberta, se é avaliativa e quantos enviaram, sem nome de ninguém', () => {
    expect(situacaoDaAplicacao({ estado: 'aberta', avaliativa: true, participacao: { alunos: 30, iniciaram: 20, enviaram: 12 } })).toBe('Aberta para a turma · avaliativa · 12 de 30 alunos enviaram')
    expect(situacaoDaAplicacao({ estado: 'encerrada', avaliativa: false, participacao: { alunos: 1, iniciaram: 1, enviaram: 1 } })).toBe('Encerrada · prática · 1 de 1 aluno enviaram')
  })

  it('o motivo do destaque é dito como fato do trabalho, e não como juízo sobre o aluno', () => {
    expect(explicacoesDoDestaque({ motivos: ['em_branco'] })).toBe('Nenhuma questão foi respondida.')
    expect(explicacoesDoDestaque({ motivos: ['fora_do_historico', 'padrao_de_erro'] })).toBe(
      'Os acertos ficaram bem acima ou bem abaixo dos que ele teve nas correções aprovadas desta disciplina. A mesma alternativa em todas as questões, ou erro em questões que quase toda a turma acertou.',
    )
    for (const texto of Object.values(textos.EXPLICACAO_DO_MOTIVO)) expect(texto).not.toMatch(/desatent|chut|preguiç|desinteress|colou|cola\b|dificuldade de aprend/i)
  })

  it('a atividade encerrada sem correção diz por quê: ninguém respondeu, a função está suspensa, ou o lote foi rejeitado', () => {
    const participacao = { alunos: 30, iniciaram: 12, enviaram: 10 }
    expect(semCorrecao({ estado: 'aberta', entrega: null, participacao })).toBeUndefined()
    expect(semCorrecao({ estado: 'encerrada', entrega: null, participacao: { alunos: 30, iniciaram: 0, enviaram: 0 } })).toBe('ninguem_respondeu')
    expect(semCorrecao({ estado: 'encerrada', entrega: null, participacao })).toBe('correcao_suspensa')
    expect(semCorrecao({ estado: 'encerrada', entrega: { id: id('e1'), estado: 'rejeitada' }, participacao })).toBe('lote_rejeitado')
    expect(semCorrecao({ estado: 'encerrada', entrega: { id: id('e1'), estado: 'pendente' }, participacao })).toBeUndefined()
    expect(semCorrecao({ estado: 'encerrada', entrega: { id: id('e1'), estado: 'aprovada' }, participacao })).toBeUndefined()
  })

  it('D46: é diagnóstico, não nota — nenhum texto fixo desta tela fala em nota, conceito ou pontuação', () => {
    const fixos = [
      ...Object.values(textos).flatMap((valor) => (typeof valor === 'string' ? [valor] : [])),
      ...textos.ESCOLHA_DE_AVALIATIVA.flatMap((item) => [item.rotulo, item.descricao]),
      ...Object.values(textos.EXPLICACAO_DO_MOTIVO),
      ...Object.values(textos.TEXTO_SEM_CORRECAO),
    ]
    expect(fixos.length).toBeGreaterThan(4)
    const gerados = [textoDaMedia(RESUMO), textoDosCorrigidos(RESUMO), rotuloDeAprovar(3), rotuloDaFaixa({ de: 0, ate: 2 }), acertosDoAluno({ acertos: 1, total: 5, emBranco: 1 }), contadorDosDestaques({ destaques: [destaque('01')], destaquesAbertos: 0, podeAprovar: false }).porQue ?? '']
    for (const texto of [...fixos, ...gerados]) expect(texto).not.toMatch(/\bnotas?\b|\bconceitos?\b|pontua/i)
  })
})
