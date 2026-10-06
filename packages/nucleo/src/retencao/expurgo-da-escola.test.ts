import { CHAVES_DE_RETENCAO } from '@educa/shared'
import { describe, expect, it } from 'vitest'
import { CATEGORIAS_DO_EXPURGO, noitesSeguidasSemConcluir, ordemDaNoite } from './expurgo-da-escola.repository.js'

const CATALOGO = ['conversa_tutor', 'sinal_tutor', 'conversa_professor', 'execucao_agente', 'texto_do_modelo', 'consumo_por_aluno', 'autoria_de_artefato']

describe('ordem da noite do expurgo da escola (F3, tarefas 3.0 e 4.0)', () => {
  it('sem categoria pendente, a ordem do catálogo', () => {
    expect(ordemDaNoite(undefined)).toEqual(CATALOGO)
    expect(CATEGORIAS_DO_EXPURGO).toEqual(CHAVES_DE_RETENCAO.filter((categoria) => (CATEGORIAS_DO_EXPURGO as readonly string[]).includes(categoria)))
  })

  it('com a pendente, começa por ela e dá a volta no catálogo, passando por todas uma vez', () => {
    expect(ordemDaNoite('sinal_tutor')).toEqual(['sinal_tutor', 'conversa_professor', 'execucao_agente', 'texto_do_modelo', 'consumo_por_aluno', 'autoria_de_artefato', 'conversa_tutor'])
    expect(ordemDaNoite('texto_do_modelo')).toEqual(['texto_do_modelo', 'consumo_por_aluno', 'autoria_de_artefato', 'conversa_tutor', 'sinal_tutor', 'conversa_professor', 'execucao_agente'])
    expect(ordemDaNoite('autoria_de_artefato')).toEqual(['autoria_de_artefato', ...CATALOGO.slice(0, -1)])
    expect(ordemDaNoite('conversa_tutor')).toEqual(CATALOGO)
  })

  it('uma pendente que o expurgo ainda não percorre (de outra tarefa) não muda a ordem', () => {
    expect(ordemDaNoite('pessoa_desativada')).toEqual(CATALOGO)
  })
})

describe('noites seguidas sem concluir, que o alerta lê (F3, tarefa 3.0)', () => {
  const completa = { contada: true, concluidas: 3 }
  const parcial = { contada: true, concluidas: 2 }
  const antesDaPrimeira = { contada: false, concluidas: 0 }

  it('duas noites parciais dão 2; parcial seguida de completa (ontem parcial) dá 1; ontem completa dá 0', () => {
    expect(noitesSeguidasSemConcluir([parcial, parcial], 3)).toBe(2)
    expect(noitesSeguidasSemConcluir([parcial, completa], 3)).toBe(1)
    expect(noitesSeguidasSemConcluir([completa, parcial], 3)).toBe(0)
  })

  it('a noite sem nenhuma categoria concluída conta como incompleta', () => {
    expect(noitesSeguidasSemConcluir([{ contada: true, concluidas: 0 }, parcial], 3)).toBe(2)
  })

  it('a noite anterior à primeira execução da escola não conta, nem como incompleta', () => {
    expect(noitesSeguidasSemConcluir([parcial, antesDaPrimeira], 3)).toBe(1)
    expect(noitesSeguidasSemConcluir([antesDaPrimeira, antesDaPrimeira], 3)).toBe(0)
  })
})
