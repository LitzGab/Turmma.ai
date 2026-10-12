import { describe, expect, it } from 'vitest'
import { decidir, estaTrabalhando, nomesDoTime, SEM_OLHAR_MS } from './vigia.ts'

// A vigia que não acorda o modelo à toa. O erro caro é o contrário: ficar calada com o time parado. Por isso todo
// caso de dúvida acorda.

const PARADO = ['● Pronto.', '', '✻ Churned for 5s · done 15:59', '─────', '❯ ', '─────', '  ⏵⏵ bypass permissions on (shift+tab to cycle)'].join('\n')
const TRABALHANDO = ['● Rodando o portão da tarefa…', '', '✶ Forging… (2m 14s · ↓ 3.1k tokens · esc to interrupt)', '─────', '❯ ', '─────'].join('\n')
const agora = new Date('2026-10-12T10:00:00.000Z')
const ha = (minutos: number) => new Date(agora.getTime() - minutos * 60_000).toISOString()

describe('quem é do time', () => {
  it('só os papéis, com ou sem número de linha, entre os agentes ligados', () => {
    const lista = [
      'You:',
      '  - name: "Claude Code"',
      '',
      'Connected agents:',
      '  - name: "Arquiteto"',
      '  - name: "Implementador"',
      '  - name: "Mesa 2"',
      '  - name: "Implementador 2"',
      '  - name: "Validador"',
      '  - name: "Claude Code #2"',
      '  - name: "Mesa de bar"',
    ].join('\n')
    expect(nomesDoTime(lista)).toEqual(['Arquiteto', 'Implementador', 'Mesa 2', 'Implementador 2', 'Validador'])
    expect(nomesDoTime('You:\n  - name: "Arquiteto"\n')).toEqual([])
  })

  it('trabalha quem mostra "esc to interrupt" no fim da tela, e não quem o tem lá em cima, de um turno antigo', () => {
    expect(estaTrabalhando(TRABALHANDO)).toBe(true)
    expect(estaTrabalhando(PARADO)).toBe(false)
    expect(estaTrabalhando(`${TRABALHANDO}\n${'linha\n'.repeat(30)}${PARADO}`)).toBe(false)
  })
})

describe('acordar ou não', () => {
  it('com alguém trabalhando, não acorda, e guarda desde quando', () => {
    const decisao = decidir({ Implementador: PARADO, Mesa: TRABALHANDO }, {}, agora)
    expect(decisao).toEqual({ acordar: false, motivo: 'Mesa trabalhando', visto: { Mesa: agora.toISOString() } })
    expect(decidir({ Mesa: TRABALHANDO }, { Mesa: ha(90) }, agora).visto).toEqual({ Mesa: ha(90) })
  })

  it('com todos parados, acorda: alguém deve um relatório, ou há pergunta na tela', () => {
    expect(decidir({ Implementador: PARADO, Mesa: PARADO }, { Mesa: ha(30) }, agora)).toEqual({ acordar: true, motivo: 'ninguém trabalhando', visto: {} })
  })

  it('sem terminal do time, ou com tela vazia, acorda', () => {
    expect(decidir({}, {}, agora).acordar).toBe(true)
    expect(decidir({ Implementador: '' }, {}, agora).acordar).toBe(true)
  })

  it('quem trabalha há duas horas sem a vigia olhar acorda o modelo uma vez, e o relógio recomeça', () => {
    const limite = SEM_OLHAR_MS / 60_000
    expect(decidir({ Implementador: TRABALHANDO }, { Implementador: ha(limite - 1) }, agora).acordar).toBe(false)
    const demorou = decidir({ Implementador: TRABALHANDO, 'Implementador 2': TRABALHANDO }, { Implementador: ha(limite), 'Implementador 2': ha(10) }, agora)
    expect(demorou.acordar).toBe(true)
    expect(demorou.motivo).toBe('Implementador trabalha há duas horas sem a vigia olhar')
    expect(demorou.visto).toEqual({ Implementador: agora.toISOString(), 'Implementador 2': ha(10) })
  })

  it('quem parou e voltou a trabalhar recomeça a contagem', () => {
    const parou = decidir({ Implementador: PARADO, Mesa: TRABALHANDO }, { Implementador: ha(119) }, agora)
    expect(parou.visto).toEqual({ Mesa: agora.toISOString() })
  })
})
