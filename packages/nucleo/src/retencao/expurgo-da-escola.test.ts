import { CHAVES_DE_RETENCAO } from '@educa/shared'
import { describe, expect, it } from 'vitest'
import { CATEGORIAS_DO_EXPURGO, noitesSeguidasSemConcluir, ordemDaNoite } from './expurgo-da-escola.repository.js'

describe('ordem da noite do expurgo da escola (F3, tarefa 3.0)', () => {
  it('sem categoria pendente, a ordem do catálogo', () => {
    expect(ordemDaNoite(undefined)).toEqual(['conversa_tutor', 'sinal_tutor', 'conversa_professor'])
    expect(CATEGORIAS_DO_EXPURGO).toEqual(CHAVES_DE_RETENCAO.filter((categoria) => (CATEGORIAS_DO_EXPURGO as readonly string[]).includes(categoria)))
  })

  it('com a pendente, começa por ela e dá a volta no catálogo, passando por todas uma vez', () => {
    expect(ordemDaNoite('sinal_tutor')).toEqual(['sinal_tutor', 'conversa_professor', 'conversa_tutor'])
    expect(ordemDaNoite('conversa_professor')).toEqual(['conversa_professor', 'conversa_tutor', 'sinal_tutor'])
    expect(ordemDaNoite('conversa_tutor')).toEqual(['conversa_tutor', 'sinal_tutor', 'conversa_professor'])
  })

  it('uma pendente que o expurgo ainda não apaga (de outra tarefa) não muda a ordem', () => {
    expect(ordemDaNoite('pessoa_desativada')).toEqual(['conversa_tutor', 'sinal_tutor', 'conversa_professor'])
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
