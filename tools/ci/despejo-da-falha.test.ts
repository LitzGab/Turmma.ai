import { describe, expect, it } from 'vitest'
import { lerLinhaDoDespejo } from './despejo-da-falha.ts'

describe('lerLinhaDoDespejo', () => {
  it('lê o serviço e o carimbo do Docker de uma linha com o prefixo do compose', () => {
    const linha = lerLinhaDoDespejo('postgres-1  | 2026-10-24T13:04:00.513760237Z 2026-10-24 13:04:00.511 UTC [66] LOG:  ok')
    expect(linha?.servico).toBe('postgres-1')
    expect(linha?.instante).toBe(Date.parse('2026-10-24T13:04:00.513Z'))
  })

  it('lê a linha da esteira 40095652612, a que chegou sem o `|` do prefixo mas com o carimbo do Docker', () => {
    // Literal do log da esteira: o compose entregou `postgres-1` + quatro espaços, sem o `|`, e o resto igual.
    const linha = lerLinhaDoDespejo(
      'postgres-1    2026-10-24T13:04:00.513760237Z 2026-10-24 13:04:00.511 UTC [66] FATAL:  terminating connection due to administrator command',
    )
    expect(linha?.servico).toBe('postgres-1')
    expect(linha?.instante).toBe(Date.parse('2026-10-24T13:04:00.513Z'))
  })

  it('aceita um espaço só entre o serviço e o carimbo: o `|` do prefixo e o alinhamento são do compose, e não da promessa', () => {
    // Intencional: o despejo promete o carimbo do Docker logo depois do prefixo, seja qual for a largura dele.
    expect(lerLinhaDoDespejo('postgres-1 2026-10-24T13:04:00.513Z ok')?.servico).toBe('postgres-1')
  })

  it('aceita o carimbo sem fração, quando o nanossegundo é exatamente 0', () => {
    expect(lerLinhaDoDespejo('redis-fila-1  | 2026-10-24T13:04:09Z 1:M ready')?.instante).toBe(Date.parse('2026-10-24T13:04:09Z'))
  })

  it.each([
    ['carimbo do próprio Postgres, sem o do Docker', 'postgres-1  | 2026-10-24 13:04:00.511 UTC [66] LOG:  ok'],
    ['carimbo do próprio Redis, sem o do Docker', 'redis-fila-1  | 1:M 24 Oct 2026 13:04:00.511 * Ready'],
    ['carimbo do Caddy, em época', 'borda-1  | {"ts":1789870704.789,"msg":"x"}'],
    ['carimbo com deslocamento no lugar do Z', 'postgres-1  | 2026-10-24T13:04:00.513-03:00 ok'],
    ['carimbo do Docker depois da mensagem, e não logo depois do prefixo', 'postgres-1  | LOG: ok 2026-10-24T13:04:00.513Z '],
    ['linha sem serviço', '2026-10-24T13:04:00.513Z ok'],
    ['dois carimbos e nenhum serviço: o primeiro não é nome de serviço', '2026-10-24T13:04:00.513Z 2026-10-24T13:04:00.514Z ok'],
    ['carimbo no formato certo e impossível, de mês 13', 'postgres-1  | 2026-13-45T99:99:99Z ok'],
    ['serviço sem carimbo nenhum', 'postgres-1  | LOG:  ok'],
    ['serviço sem carimbo e sem o `|` do prefixo', 'postgres-1    LOG:  ok'],
  ])('recusa %s', (_motivo, linha) => {
    expect(lerLinhaDoDespejo(linha)).toBeUndefined()
  })
})
