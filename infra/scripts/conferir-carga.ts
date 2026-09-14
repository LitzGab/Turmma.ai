import { setTimeout as esperar } from 'node:timers/promises'
import { pathToFileURL } from 'node:url'
import { parseArgs } from 'node:util'
import pg from 'pg'

/**
 * Conferência do cenário "justiça entre escolas" no banco (tarefa 15.0), depois do k6:
 *
 *   node --env-file=.env.example --env-file=infra/carga.env infra/scripts/conferir-carga.ts --escola <uuid> ...
 *
 * O k6 mede a espera da escola B pela API; aqui é o `job_registro` que confirma, para as escolas do cenário,
 * que nenhum job terminou `falhou` e que nenhum job interativo esperou mais de 30 s para começar, contando
 * como espera até agora o que ainda nem começou. `npm run carga` chama `conferirJobRegistro` direto.
 *
 * Lê só as escolas sintéticas passadas, no banco do compose de carga: é rotina nossa de teste, sem contexto de
 * requisição, e por isso consulta a tabela direto, sem repository (regra 10, item 9).
 */

/** O alerta do runbook: job interativo esperando mais que isto já é problema na sala. */
export const ESPERA_MAXIMA_INTERATIVO_MS = 30_000

export interface LinhaDaConferencia {
  escolaId: string
  fila: string
  total: number
  concluidos: number
  falhos: number
  /** Ainda não começou (aguardando, reservado ou publicado). */
  semInicio: number
  /** Esperou, ou está esperando até agora, mais que o prazo do interativo. Só conta na fila interativa. */
  acimaDoPrazo: number
  /** Espera de `criado_em` a `iniciado_em`, dos que começaram. Nulo sem nenhum iniciado. */
  esperaP95Ms: number | null
  esperaMaximaMs: number | null
}

export interface ConferenciaDaCarga {
  linhas: LinhaDaConferencia[]
  /** O que reprova, em português. Vazia: o banco confirma o cenário. */
  reprovacoes: string[]
}

type Consultavel = Pick<pg.ClientBase, 'query'>

const inteiro = (valor: unknown): number => Number(valor)
const talvezNumero = (valor: unknown): number | null => (valor === null || valor === undefined ? null : Math.round(Number(valor)))

/** Resumo por escola e fila das escolas do cenário, e o veredito sobre falha e espera do interativo. */
export async function conferirJobRegistro(banco: Consultavel, escolas: readonly string[], esperaMaximaInterativoMs = ESPERA_MAXIMA_INTERATIVO_MS): Promise<ConferenciaDaCarga> {
  if (escolas.length === 0) throw new Error('a conferência precisa das escolas do cenário')
  const { rows } = await banco.query<Record<string, unknown>>(
    `select escola_id as "escolaId", fila,
            count(*) as total,
            count(*) filter (where estado = 'concluido') as concluidos,
            count(*) filter (where estado = 'falhou') as falhos,
            count(*) filter (where iniciado_em is null and estado not in ('concluido', 'falhou')) as "semInicio",
            count(*) filter (where fila = 'interativa' and coalesce(iniciado_em, clock_timestamp()) - criado_em > make_interval(secs => $2::float8 / 1000)) as "acimaDoPrazo",
            percentile_cont(0.95) within group (order by extract(epoch from iniciado_em - criado_em)::float8 * 1000) as "esperaP95Ms",
            max(extract(epoch from iniciado_em - criado_em)::float8 * 1000) as "esperaMaximaMs"
       from job_registro
      where escola_id = any($1::uuid[])
      group by escola_id, fila
      order by escola_id, fila`,
    [escolas, esperaMaximaInterativoMs],
  )
  const linhas: LinhaDaConferencia[] = rows.map((linha) => ({
    escolaId: String(linha['escolaId']),
    fila: String(linha['fila']),
    total: inteiro(linha['total']),
    concluidos: inteiro(linha['concluidos']),
    falhos: inteiro(linha['falhos']),
    semInicio: inteiro(linha['semInicio']),
    acimaDoPrazo: inteiro(linha['acimaDoPrazo']),
    esperaP95Ms: talvezNumero(linha['esperaP95Ms']),
    esperaMaximaMs: talvezNumero(linha['esperaMaximaMs']),
  }))
  const falhos = linhas.reduce((soma, linha) => soma + linha.falhos, 0)
  const acimaDoPrazo = linhas.reduce((soma, linha) => soma + linha.acimaDoPrazo, 0)
  const reprovacoes = [
    ...(linhas.length === 0 ? ['nenhum job das escolas do cenário em job_registro'] : []),
    ...(falhos > 0 ? [`${falhos} job(s) terminaram falhou`] : []),
    ...(acimaDoPrazo > 0 ? [`${acimaDoPrazo} job(s) interativo(s) esperaram mais de ${esperaMaximaInterativoMs / 1_000} s para começar`] : []),
  ]
  return { linhas, reprovacoes }
}

/**
 * Espera os interativos das escolas terminarem de começar, até o prazo. O lote da escola A leva meia hora para
 * esvaziar com duas vagas, e não é esperado: o que ainda não começou dele não conta como falha.
 */
export async function aguardarInterativosIniciados(banco: Consultavel, escolas: readonly string[], prazoMs: number): Promise<void> {
  const limite = Date.now() + prazoMs
  while (Date.now() < limite) {
    const { rows } = await banco.query<{ pendentes: string }>(
      `select count(*) as pendentes from job_registro
        where escola_id = any($1::uuid[]) and fila = 'interativa' and iniciado_em is null and estado not in ('concluido', 'falhou')`,
      [escolas],
    )
    if (Number(rows[0]?.pendentes ?? 0) === 0) return
    await esperar(1_000)
  }
}

/** Uma linha por escola e fila, para o resultado da execução. */
export function descreverConferencia(conferencia: ConferenciaDaCarga, nomes: Readonly<Record<string, string>> = {}): string[] {
  const ms = (valor: number | null) => (valor === null ? '-' : `${valor} ms`)
  return conferencia.linhas.map(
    (linha) =>
      `escola ${nomes[linha.escolaId] ?? linha.escolaId}, fila ${linha.fila}: ${linha.total} jobs, ${linha.concluidos} concluídos, ${linha.falhos} falhos, ` +
      `${linha.semInicio} sem início; espera p95 ${ms(linha.esperaP95Ms)}, máxima ${ms(linha.esperaMaximaMs)}`,
  )
}

export function urlDoBancoDoAmbiente(ambiente: Record<string, string | undefined>): string {
  const obrigatoria = (chave: string): string => {
    const valor = ambiente[chave]
    if (valor === undefined || valor === '') throw new Error(`defina ${chave}`)
    return valor
  }
  return `postgres://${obrigatoria('POSTGRES_USUARIO')}:${obrigatoria('POSTGRES_SENHA')}@127.0.0.1:${obrigatoria('POSTGRES_PORTA_HOST')}/${obrigatoria('POSTGRES_BANCO')}`
}

async function executarPelaLinhaDeComando(): Promise<void> {
  const { values } = parseArgs({ options: { escola: { type: 'string', multiple: true } }, strict: true })
  const cliente = new pg.Client({ connectionString: urlDoBancoDoAmbiente(process.env) })
  await cliente.connect()
  try {
    const conferencia = await conferirJobRegistro(cliente, values.escola ?? [])
    for (const linha of [...descreverConferencia(conferencia), ...conferencia.reprovacoes.map((motivo) => `reprovado: ${motivo}`)]) {
      process.stdout.write(`${linha}\n`)
    }
    if (conferencia.reprovacoes.length > 0) process.exitCode = 1
  } finally {
    await cliente.end()
  }
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await executarPelaLinhaDeComando()
}
