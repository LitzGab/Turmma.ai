import { Client } from 'pg'
import { describe, expect, it } from 'vitest'
import { urlDoBancoDeTeste } from '../ci/compose.ts'

/**
 * O banco de teste vivo declara o fuso da escola (correção `2026-10-12-fuso-nos-testes`; F3, retro, M2). A declaração em
 * `infra/compose.yml` é provada em `fuso.test.ts`; aqui, que o servidor que subiu a honra, e que a fábrica que insere
 * `current_date` (as do e2e e da integração) o lê por ele, em vez de pelo UTC que o contêiner traz.
 */

async function consultar<T extends object>(instrucao: string, parametros: unknown[] = []): Promise<T[]> {
  const banco = new Client({ connectionString: urlDoBancoDeTeste() })
  await banco.connect()
  try {
    return (await banco.query<T>(instrucao, parametros)).rows
  } finally {
    await banco.end()
  }
}

describe('o fuso do Postgres de teste', () => {
  it('a sessão nova nasce em America/Sao_Paulo, e o current_date dela é o dia de São Paulo, não o de UTC', async () => {
    const [sessao] = await consultar<{ fuso: string; hoje: string; hojeEmSaoPaulo: string }>(
      `select current_setting('TimeZone') as fuso,
              current_date::text as hoje,
              ((now() at time zone 'America/Sao_Paulo')::date)::text as "hojeEmSaoPaulo"`,
    )
    expect(sessao?.fuso).toBe('America/Sao_Paulo')
    // Quem prova o fuso, a qualquer hora, é a asserção acima. Esta só diverge entre 21 h e meia-noite em São Paulo, quando o
    // dia de UTC já é o seguinte e o UTC herdado dava `hoje` um dia à frente.
    expect(sessao?.hoje).toBe(sessao?.hojeEmSaoPaulo)
  })

  it('o ::date de um instante usa o dia de São Paulo, também fora da janela das 21 h à meia-noite', async () => {
    const [medida] = await consultar<{ doBanco: string; deSaoPaulo: string }>(
      `select (timestamptz '2026-10-10 01:00:00+00')::date::text as "doBanco",
              ((timestamptz '2026-10-10 01:00:00+00') at time zone 'America/Sao_Paulo')::date::text as "deSaoPaulo"`,
    )
    // 01 h de UTC do dia 10 é 22 h do dia 9 em São Paulo: o `::date` da sessão tem de dizer o dia 9.
    expect(medida?.doBanco).toBe('2026-10-09')
    expect(medida?.deSaoPaulo).toBe('2026-10-09')
  })
})
