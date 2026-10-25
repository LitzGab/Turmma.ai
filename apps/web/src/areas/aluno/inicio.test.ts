import { describe, expect, it } from 'vitest'
import { MAXIMO_DE_TAREFAS_NO_INICIO, primeiroNome, saudacaoDoAluno, tarefasParaFazer, TEXTO_DO_VAZIO, TITULO_DO_VAZIO } from './inicio'

/**
 * O que o Início do aluno diz e escolhe (telas do aluno e primeiro acesso, 3.0; RF4, RF10; D58, D59). Regra pura, sem tela
 * e sem rede. A saudação é fixa: o texto não muda com o nome nem com o uso, e nenhuma frase promete que o Tutor está lá.
 */

const tarefa = (id: string, situacao: 'para_fazer' | 'em_andamento' | 'enviada' | 'encerrada' | 'com_diagnostico') => ({ id, situacao })

describe('a saudação do Início', () => {
  it('é a mesma frase para qualquer nome: só o primeiro nome entra, e nada de "de volta", "faz tempo" nem número', () => {
    for (const nome of ['Ana Clara Sintética', 'Bruno', 'Zé  Pedro Sintético']) {
      const saudacao = saudacaoDoAluno(nome)
      expect(saudacao.replace(primeiroNome(nome) ?? '', 'NOME')).toBe('Oi, NOME.')
      expect(saudacao).not.toMatch(/de volta|faz tempo|\d/i)
    }
  })

  it('usa o primeiro nome e ignora o espaço antes do nome', () => {
    expect(saudacaoDoAluno('Ana Clara Sintética')).toBe('Oi, Ana.')
    expect(saudacaoDoAluno('  Bruno Sintético')).toBe('Oi, Bruno.')
  })

  it('sem nome ainda, ou com nome vazio, diz só "Oi."', () => {
    expect(saudacaoDoAluno(undefined)).toBe('Oi.')
    expect(saudacaoDoAluno('')).toBe('Oi.')
    expect(saudacaoDoAluno('   ')).toBe('Oi.')
  })
})

describe('as tarefas de "Para fazer"', () => {
  it('são as que esperam resposta, na ordem da API, até três: a quarta fica em Tarefas', () => {
    const pagina = [tarefa('a', 'enviada'), tarefa('b', 'para_fazer'), tarefa('c', 'em_andamento'), tarefa('d', 'com_diagnostico'), tarefa('e', 'para_fazer'), tarefa('f', 'para_fazer')]
    expect(MAXIMO_DE_TAREFAS_NO_INICIO).toBe(3)
    expect(tarefasParaFazer(pagina).map((cada) => cada.id)).toEqual(['b', 'c', 'e'])
  })

  it('a encerrada, a enviada e a com resultado nunca entram, e sem nenhuma a lista é vazia', () => {
    expect(tarefasParaFazer([tarefa('a', 'enviada'), tarefa('b', 'encerrada'), tarefa('c', 'com_diagnostico')])).toEqual([])
    expect(tarefasParaFazer([])).toEqual([])
  })
})

describe('o vazio do Início', () => {
  it('diz que o Tutor ajuda quando houver tarefa, e não promete que ele está disponível nem que volta', () => {
    expect(TITULO_DO_VAZIO).toBe('Nenhuma tarefa por agora')
    expect(TEXTO_DO_VAZIO).toContain('Tutor ajuda')
    expect(TEXTO_DO_VAZIO).toContain('Quando houver uma')
    expect(`${TITULO_DO_VAZIO} ${TEXTO_DO_VAZIO}`).not.toMatch(/dispon[ií]vel|sempre|estou aqui|volto|espera|esperando/i)
  })
})
