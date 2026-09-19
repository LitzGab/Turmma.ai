import type pg from 'pg'

/**
 * Conferência do cenário "login às 7h30" (tarefa 16.0) depois do k6: o que ele não vê pela API, lido no banco e no
 * Prometheus do projeto de carga. `npm run carga:login` chama `conferirCenarioDeLogin` direto.
 *
 * - **Renovação:** nenhuma família de sessões encerrada por reuso nas escolas do cenário (`sessao.motivo`), e a métrica
 *   `sessao.renovacao{resultado=reuso}` em 0 durante a fase de renovação, com renovação `ok` acontecendo.
 * - **Rebaixamento:** `login.prioridade_rebaixada` nunca em 1 fora das fases de ataque, nem na B e na C em fase nenhuma;
 *   na A, em 1 durante os ataques (o ataque foi rebaixado de fato).
 * - **Redis fora:** `limite.seguro_ativo` chega a 1 durante a fase em que o Redis de fila cai.
 * - **Informativo (16.4):** a proporção de 5xx das rotas de login na rajada, e se o alerta "Taxa de erro 5xx" (5% por
 *   5 min) dispararia; os 503 do semáforo e o atraso do event loop por fase.
 *
 * Lê só as escolas sintéticas do cenário, pelo endereço gerado nesta execução, no banco do compose de carga: é rotina
 * nossa de teste, sem contexto de requisição, e por isso consulta a tabela direto, sem repository (regra 10, item 9).
 * Nada de pessoa sai daqui: contagens e ids de escola.
 */

export interface JanelaDaFase {
  readonly fase: string
  readonly inicio: Date
  readonly fim: Date
}

export interface ConferenciaDoLogin {
  /** O que vai para o registro: uma linha por medida. */
  readonly linhas: readonly string[]
  /** O que reprova, em português. Vazia: o banco e o Prometheus confirmam o cenário. */
  readonly reprovacoes: readonly string[]
}

type Consultavel = Pick<pg.ClientBase, 'query'>

export interface EntradaDaConferencia {
  readonly banco: Consultavel
  /** A URL base do Prometheus da observabilidade do projeto de carga. */
  readonly prometheus: string
  readonly janelas: readonly JanelaDaFase[]
  readonly slugs: Readonly<Record<string, string>>
}

const FASES_DE_ATAQUE = new Set(['ataque_fora', 'ataque_dentro', 'redis_fora'])
/** O alerta "Taxa de erro 5xx" (infra/grafana/alertas/taxa-5xx.yaml): mais de 5% por 5 min. */
export const LIMIAR_DO_ALERTA_5XX = 0.05
export const PASSO_DA_CONSULTA_S = 10
const PONTOS_EM_CINCO_MINUTOS = (5 * 60) / PASSO_DA_CONSULTA_S + 1

/** Uma série do Prometheus: os rótulos e o valor (instantânea) ou os valores no tempo (intervalo). */
export interface Serie {
  readonly metric: Readonly<Record<string, string>>
  readonly value?: readonly [number, string]
  readonly values?: ReadonlyArray<readonly [number, string]>
}

async function consultar(prometheus: string, caminho: 'query' | 'query_range', parametros: Record<string, string>): Promise<Serie[]> {
  const resposta = await fetch(`${prometheus}/api/v1/${caminho}?${new URLSearchParams(parametros)}`)
  if (!resposta.ok) throw new Error(`o Prometheus respondeu ${resposta.status} a ${caminho}`)
  const corpo = (await resposta.json()) as { data: { result: Serie[] } }
  return corpo.data.result
}

/** A expressão avaliada no fim da janela, sobre ela inteira (subconsulta com passo de 10 s). */
function naJanela(janela: JanelaDaFase, expressao: string): { query: string; time: string } {
  const segundos = Math.max(PASSO_DA_CONSULTA_S, Math.ceil((janela.fim.getTime() - janela.inicio.getTime()) / 1_000))
  return {
    query: `max_over_time((${expressao})[${String(segundos)}s:${String(PASSO_DA_CONSULTA_S)}s])`,
    time: String(janela.fim.getTime() / 1_000),
  }
}

const valorDe = (serie: Serie | undefined): number | undefined => (serie?.value === undefined ? undefined : Number(serie.value[1]))

/**
 * Se o alerta de 5xx dispararia: existe um trecho de 5 min seguidos (31 pontos a cada 10 s) com a proporção acima de
 * 5%. Ponto sem valor quebra o trecho, como no alerta (rota sem requisição sai da conta).
 */
export function dispararia(valores: ReadonlyArray<readonly [number, string]>, limiar = LIMIAR_DO_ALERTA_5XX): boolean {
  let seguidos = 0
  let anterior: number | undefined
  for (const [instante, texto] of valores) {
    const acima = Number(texto) > limiar
    const continua = anterior !== undefined && instante - anterior <= PASSO_DA_CONSULTA_S
    seguidos = acima ? (continua ? seguidos + 1 : 1) : 0
    anterior = instante
    if (seguidos >= PONTOS_EM_CINCO_MINUTOS) return true
  }
  return false
}

/**
 * Julga o rebaixamento pelas séries de `max by (escola_id) (login_prioridade_rebaixada)`, o máximo de cada escola em cada
 * fase: fora dos ataques, nenhuma escola em 1; nos ataques, só a A, e a A precisa chegar a 1 em cada ataque que rodou.
 * As fases que rodaram vêm das janelas, e não das séries: o gauge só nasce no primeiro rebaixamento, e o ataque que não
 * rebaixou não deixa série nenhuma.
 */
export function julgarRebaixamento(maximos: ReadonlyArray<{ fase: string; escola: string; maximo: number }>, escolaA: string, fasesQueRodaram: readonly string[]): string[] {
  const reprovacoes: string[] = []
  for (const { fase, escola, maximo } of maximos) {
    if (maximo < 1) continue
    if (!FASES_DE_ATAQUE.has(fase)) reprovacoes.push(`${fase}: login.prioridade_rebaixada em 1 na escola ${escola}, fora de ataque`)
    else if (escola !== escolaA) reprovacoes.push(`${fase}: login.prioridade_rebaixada em 1 na escola ${escola}, que não era a atacada`)
  }
  for (const fase of new Set(fasesQueRodaram.filter((fase) => FASES_DE_ATAQUE.has(fase)))) {
    if (!maximos.some((maximo) => maximo.fase === fase && maximo.escola === escolaA && maximo.maximo >= 1)) reprovacoes.push(`${fase}: o ataque não rebaixou a escola A`)
  }
  return reprovacoes
}

export async function conferirCenarioDeLogin({ banco, prometheus, janelas, slugs }: EntradaDaConferencia): Promise<ConferenciaDoLogin> {
  const linhas: string[] = []
  const reprovacoes: string[] = []
  const { rows: escolas } = await banco.query<{ id: string; slug: string }>('select id, slug from escola where slug = any($1::text[])', [Object.values(slugs)])
  const nomeDe = (id: string) => Object.entries(slugs).find(([, slug]) => escolas.find((escola) => escola.id === id)?.slug === slug)?.[0] ?? id
  const escolaA = escolas.find((escola) => escola.slug === slugs['A'])?.id
  if (escolaA === undefined || escolas.length !== Object.keys(slugs).length) throw new Error('a conferência não achou as escolas do cenário')

  // Renovação: nenhuma família encerrada por reuso, no banco e na métrica.
  const { rows: reuso } = await banco.query<{ total: string }>(`select count(*) as total from sessao where motivo = 'reuso_de_refresh' and escola_id = any($1::uuid[])`, [
    escolas.map((escola) => escola.id),
  ])
  const encerradasPorReuso = Number(reuso[0]?.total ?? 0)
  linhas.push(`sessões encerradas por reuso de refresh nas escolas do cenário: ${String(encerradasPorReuso)}`)
  if (encerradasPorReuso > 0) reprovacoes.push(`${String(encerradasPorReuso)} família(s) de sessão encerrada(s) por reuso`)
  const renovacao = janelas.find((janela) => janela.fase === 'renovacao')
  if (renovacao !== undefined) {
    const aumento = async (resultado: string) =>
      valorDe((await consultar(prometheus, 'query', naJanela(renovacao, `sum(increase(sessao_renovacao_total{job="educa/api", resultado="${resultado}"}[1m]))`)))[0]) ?? 0
    const [reusos, ok, jaRenovado] = [await aumento('reuso'), await aumento('ok'), await aumento('ja_renovado')]
    linhas.push(`renovação (maior aumento por minuto): ok ${String(Math.round(ok))}, ja_renovado ${String(Math.round(jaRenovado))}, reuso ${String(Math.round(reusos))}`)
    if (reusos > 0) reprovacoes.push('sessao.renovacao{resultado=reuso} acima de 0 na fase de renovação')
    if (ok <= 0) reprovacoes.push('sessao.renovacao{resultado=ok} sem aumento na fase de renovação: a métrica não chegou')
  }

  // Rebaixamento: o máximo de cada escola em cada fase.
  const maximos: Array<{ fase: string; escola: string; maximo: number }> = []
  for (const janela of janelas) {
    for (const serie of await consultar(prometheus, 'query', naJanela(janela, 'max by (escola_id) (login_prioridade_rebaixada{job="educa/api"})'))) {
      const escola = nomeDe(serie.metric['escola_id'] ?? '')
      maximos.push({ fase: janela.fase, escola, maximo: valorDe(serie) ?? 0 })
      linhas.push(`${janela.fase}: login.prioridade_rebaixada máximo na escola ${escola} = ${String(valorDe(serie) ?? 0)}`)
    }
  }
  reprovacoes.push(...julgarRebaixamento(maximos, 'A', janelas.map((janela) => janela.fase)))

  // Redis de fila fora: o seguro em memória ligou.
  const redisFora = janelas.find((janela) => janela.fase === 'redis_fora')
  if (redisFora !== undefined) {
    const seguro = valorDe((await consultar(prometheus, 'query', naJanela(redisFora, 'max(limite_seguro_ativo{job="educa/api"})')))[0])
    linhas.push(`redis_fora: limite.seguro_ativo máximo = ${String(seguro ?? '-')}`)
    if (seguro === undefined || seguro < 0.99) reprovacoes.push('redis_fora: limite.seguro_ativo não chegou a 1 com o Redis de fila fora')
  }

  // Informativo: 5xx do login (16.4), 503 do semáforo e atraso do event loop, por fase.
  for (const janela of janelas) {
    const cincoXX =
      '(sum by (http_route) (rate(http_server_request_duration_seconds_count{job="educa/api", http_route=~"/v1/sessao/(matricula|email)", http_response_status_code=~"5.."}[1m])) / sum by (http_route) (rate(http_server_request_duration_seconds_count{job="educa/api", http_route=~"/v1/sessao/(matricula|email)"}[1m])))'
    const faixa = await consultar(prometheus, 'query_range', {
      query: cincoXX,
      start: String(janela.inicio.getTime() / 1_000),
      end: String(janela.fim.getTime() / 1_000),
      step: `${String(PASSO_DA_CONSULTA_S)}s`,
    })
    for (const serie of faixa) {
      const valores = serie.values ?? []
      const maximo = Math.max(0, ...valores.map(([, texto]) => Number(texto)))
      linhas.push(
        `${janela.fase}: 5xx em ${serie.metric['http_route'] ?? '?'} máximo ${(maximo * 100).toFixed(1)}%, alerta de 5xx dispararia: ${dispararia(valores) ? 'sim' : 'não'}`,
      )
    }
    const recusados = valorDe(
      (
        await consultar(prometheus, 'query', {
          query: `sum(increase(login_hash_recusado_total{job="educa/api"}[${String(Math.ceil((janela.fim.getTime() - janela.inicio.getTime()) / 1_000))}s]))`,
          time: String(janela.fim.getTime() / 1_000),
        })
      )[0],
    )
    const atraso = valorDe((await consultar(prometheus, 'query', naJanela(janela, 'max(nodejs_eventloop_delay_p99_seconds{job="educa/api"})')))[0])
    linhas.push(
      `${janela.fase}: 503 do semáforo ${String(Math.round(recusados ?? 0))}, atraso do event loop (p99, máximo) ${atraso === undefined ? '-' : `${String(Math.round(atraso * 1_000))} ms`}`,
    )
  }
  return { linhas, reprovacoes }
}

export function descreverConferenciaDeLogin(conferencia: ConferenciaDoLogin): string[] {
  return [...conferencia.linhas.map((linha) => `  ${linha}`), ...conferencia.reprovacoes.map((motivo) => `  ✖ ${motivo}`)]
}
