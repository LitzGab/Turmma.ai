import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { join } from 'node:path'
import { setTimeout as esperar } from 'node:timers/promises'
import { pathToFileURL } from 'node:url'
import pg from 'pg'
import type { criarEscola, criarRede } from '../../apps/api/src/ops/escola.ts'
import type { criarSessoesSinteticas, emissorDeTokenSintetico } from '../../apps/api/src/sessao/sessoes-sinteticas.ts'
import type { criarBanco, criarPool } from '@educa/nucleo'
import { raizRepositorio } from '../../tools/ci/executar.ts'

/**
 * Ensaio dos alertas locais (Tech Spec, seção 5; runbook, "Ensaiar os alertas"):
 *
 *   npm run ensaio:alertas
 *
 * Com o ambiente local de pé, provoca as três condições ao mesmo tempo e confere pela API do Grafana que as
 * três regras de `infra/grafana/alertas/` chegam a disparadas:
 *   - para o `worker-interativo` e manda um job interativo, que fica esperando;
 *   - para o Redis de cache, e a API passa a limitar com o seguro em memória;
 *   - força 5xx em `POST /v1/sistema/jobs-sinteticos`, com um gatilho temporário no banco que recusa a
 *     gravação só da escola sintética do ensaio, e manda requisição a ela a cada segundo.
 * No fim, com sucesso ou não, restaura tudo: remove o gatilho, religa o Redis de cache e os workers, e
 * espera as três regras voltarem a normal.
 *
 * Só roda com `AMBIENTE=local`: ele para serviço e faz a API falhar de propósito.
 */

export const REGRAS_DO_ENSAIO = {
  jobInterativo: 'educa-job-interativo-esperando',
  seguroDoLimite: 'educa-seguro-limite-ativo',
  taxa5xx: 'educa-taxa-5xx',
} as const

export type UidDaRegra = (typeof REGRAS_DO_ENSAIO)[keyof typeof REGRAS_DO_ENSAIO]

/**
 * Todas as regras de `infra/grafana/alertas/`: as três que o ensaio provoca e as que têm prova própria no teste de
 * alertas (`infra/test/alertas.int.test.ts`), como o reuso de refresh, que precisa de sessões renovadas e não de
 * serviço parado.
 */
export const REGRAS_PROVISIONADAS = {
  ...REGRAS_DO_ENSAIO,
  reusoDeRefresh: 'educa-reuso-de-refresh',
} as const

export const WORKERS_INTERATIVOS = ['worker-interativo-1', 'worker-interativo-2'] as const
/** Rota template onde o ensaio força o 5xx, como aparece no rótulo `http_route`. */
export const ROTA_DA_FALHA = '/v1/sistema/jobs-sinteticos'
/**
 * Nome do gatilho e da função temporários: fixo, para um ensaio interrompido ser limpo pelo seguinte. Por isso
 * dois ensaios ao mesmo tempo no mesmo banco atrapalham um ao outro (runbook, "Ensaiar os alertas").
 */
export const GATILHO_DA_FALHA = 'ensaio_alerta_falha_forcada'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
const USUARIOS_POR_ESCOLA = 10
/** Quem a auditoria das escolas sintéticas do ensaio registra como operador. */
const OPERADOR_DO_ENSAIO = 'ensaio-alertas'

export type EstadoDoAlerta = 'normal' | 'pendente' | 'disparado' | 'erro'

export interface AlertaNoGrafana {
  estado: EstadoDoAlerta
  rotulos: Record<string, string>
  /**
   * Desde quando o alerta está no estado atual, em ms (o `activeAt` do Grafana): o início da pendência enquanto
   * pendente, e o do disparo depois de disparado. `undefined` se normal.
   */
  desdeMs: number | undefined
}

export interface RegraNoGrafana {
  uid: string
  titulo: string
  /** Estado da regra: `inactive`, `pending` ou `firing`. */
  estado: string
  /** O `for:` da regra, em segundos. */
  duracaoS: number
  alertas: AlertaNoGrafana[]
}

export interface ResultadoDeComando {
  codigo: number
  saida: string
}

/** Uma escola do ensaio com as sessões dela: cada item dá um token novo da sua sessão a cada chamada. */
export interface EscolaDoEnsaio {
  escolaId: string
  tokens: Array<() => Promise<string>>
}

/**
 * Cria uma escola com `quantidade` sessões reais: a API só aceita token de sessão gravada. O token de acesso vale
 * 10 min, e o ensaio passa disso: por isso cada pedido pede um token novo.
 */
export type CriarEscolaComSessoes = (quantidade: number) => Promise<EscolaDoEnsaio>

export interface OpcoesDoEnsaio {
  /** `docker compose` já com projeto e arquivos: recebe só o subcomando. */
  compose: (...argumentos: string[]) => Promise<ResultadoDeComando>
  /** Serviços que o ensaio sobe antes de começar; vazio sobe o ambiente inteiro. */
  servicos: readonly string[]
  apiUrl: string
  grafanaUrl: string
  bancoUrl: string
  ambiente: Record<string, string | undefined>
  criarEscolaComSessoes: CriarEscolaComSessoes
  registrar?: (linha: string) => void
  sinal?: AbortSignal
  prazoParaDispararMs?: number
  prazoParaNormalizarMs?: number
}

export interface DisparoObservado {
  /** Rótulos do alerta disparado que o ensaio provocou. */
  rotulos: Record<string, string>
  /** Início da pendência, como o Grafana informou enquanto o alerta estava pendente. */
  pendenteDesdeMs: number
  /** Início do disparo, como o Grafana informou depois de disparado. */
  disparadoDesdeMs: number
  /** O `for:` da regra, em segundos. */
  duracaoS: number
}

export interface ResultadoDoEnsaio {
  escolaDoJob: string
  escolaDaFalha: string
  escolaDoSeguro: string
  jobId: string
  /** Job que outra escola gravou na rota da falha, com o gatilho valendo: a falha forçada é só da escola do ensaio. */
  jobDeOutraEscolaNaFalha: string
  disparos: Record<UidDaRegra, DisparoObservado>
  normalizadoEmMs: number
  /** Status das requisições à rota da falha, contados durante o ensaio. */
  statusDaFalha: Record<string, number>
}

const texto = (valor: unknown): string => (typeof valor === 'string' ? valor : '')
const registro = (valor: unknown): Record<string, unknown> => (typeof valor === 'object' && valor !== null ? (valor as Record<string, unknown>) : {})
const lista = (valor: unknown): unknown[] => (Array.isArray(valor) ? valor : [])

/** `Normal`, `Normal (NoData)`, `Pending`, `Alerting`, `Alerting (NoData)`, `Error`: o estado que importa ao ensaio. */
export function estadoDoAlerta(estado: string): EstadoDoAlerta {
  if (estado.startsWith('Alerting')) return 'disparado'
  if (estado.startsWith('Pending')) return 'pendente'
  if (estado.startsWith('Error')) return 'erro'
  if (estado.startsWith('Normal')) return 'normal'
  // Estado que o ensaio não conhece não pode passar por normal: "voltou a normal" seria verdade por construção.
  throw new Error(`estado de alerta desconhecido no Grafana: ${estado || 'vazio'}`)
}

/** As regras da resposta de `/api/prometheus/grafana/api/v1/rules`, por uid. */
export function regrasDaResposta(corpo: unknown): Map<string, RegraNoGrafana> {
  const regras = new Map<string, RegraNoGrafana>()
  for (const grupo of lista(registro(registro(corpo)['data'])['groups'])) {
    for (const bruta of lista(registro(grupo)['rules'])) {
      const regra = registro(bruta)
      const uid = texto(regra['uid'])
      if (uid === '') continue
      regras.set(uid, {
        uid,
        titulo: texto(regra['name']),
        estado: texto(regra['state']),
        duracaoS: typeof regra['duration'] === 'number' ? regra['duration'] : 0,
        alertas: lista(regra['alerts']).map((alertaBruto) => {
          const alerta = registro(alertaBruto)
          const estado = estadoDoAlerta(texto(alerta['state']))
          const ativoDesde = Date.parse(texto(alerta['activeAt']))
          const rotulos = Object.fromEntries(Object.entries(registro(alerta['labels'])).map(([chave, valor]) => [chave, texto(valor)]))
          return { estado, rotulos, desdeMs: estado === 'normal' || Number.isNaN(ativoDesde) ? undefined : ativoDesde }
        }),
      })
    }
  }
  return regras
}

export async function lerRegrasNoGrafana(grafanaUrl: string): Promise<Map<string, RegraNoGrafana>> {
  const resposta = await fetch(`${grafanaUrl}/api/prometheus/grafana/api/v1/rules`, { signal: AbortSignal.timeout(5_000) })
  if (!resposta.ok) throw new Error(`Grafana respondeu ${resposta.status} ao listar as regras de alerta`)
  return regrasDaResposta(await resposta.json())
}

/** O alerta de uma regra cujos rótulos contêm todos os `rotulos` pedidos. */
export function alertaCom(regra: RegraNoGrafana | undefined, rotulos: Record<string, string>): AlertaNoGrafana | undefined {
  return regra?.alertas.find((alerta) => Object.entries(rotulos).every(([chave, valor]) => alerta.rotulos[chave] === valor))
}

export async function criarJobSintetico(apiUrl: string, token: string, pedido: { fila: string; cpuMs: number }): Promise<Response> {
  return fetch(`${apiUrl}/v1/sistema/jobs-sinteticos`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...pedido, naoUrgente: false }),
    signal: AbortSignal.timeout(10_000),
  })
}

/** Sobe os serviços pedidos (ou o ambiente inteiro) e espera o healthcheck de cada um. */
async function subir(opcoes: OpcoesDoEnsaio, servicos: readonly string[]): Promise<void> {
  const resultado = await opcoes.compose('up', '--detach', '--wait', ...servicos)
  if (resultado.codigo !== 0) throw new Error(`docker compose up ${servicos.join(' ')} falhou:\n${resultado.saida}`)
}

async function comandoOuFalha(opcoes: OpcoesDoEnsaio, ...argumentos: string[]): Promise<void> {
  const resultado = await opcoes.compose(...argumentos)
  if (resultado.codigo !== 0) throw new Error(`docker compose ${argumentos.join(' ')} falhou:\n${resultado.saida}`)
}

/** Repete `verificar` até devolver algo diferente de `undefined`, ou estoura o prazo. */
async function aguardar<T>(descricao: string, prazoMs: number, sinal: AbortSignal | undefined, verificar: () => Promise<T | undefined>): Promise<T> {
  const limite = Date.now() + prazoMs
  let ultimoErro: unknown
  while (Date.now() < limite) {
    sinal?.throwIfAborted()
    try {
      const valor = await verificar()
      if (valor !== undefined) return valor
    } catch (erro) {
      ultimoErro = erro
    }
    await esperar(2_000, undefined, sinal === undefined ? {} : { signal: sinal })
  }
  throw new Error(`${descricao}: prazo de ${Math.round(prazoMs / 1_000)} s esgotado${ultimoErro instanceof Error ? ` (${ultimoErro.message})` : ''}`)
}

async function comBanco<T>(bancoUrl: string, usar: (cliente: pg.Client) => Promise<T>): Promise<T> {
  const cliente = new pg.Client({ connectionString: bancoUrl, connectionTimeoutMillis: 5_000 })
  await cliente.connect()
  try {
    return await usar(cliente)
  } finally {
    await cliente.end()
  }
}

/** Cria o gatilho que recusa a gravação de job da escola do ensaio, e só dela: as outras escolas seguem. */
export async function criarGatilhoDaFalha(bancoUrl: string, escolaId: string): Promise<void> {
  // DDL não aceita parâmetro: o id entra no texto, e só depois de conferido como UUID.
  if (!UUID.test(escolaId)) throw new Error('escola do ensaio precisa ser um UUID')
  await comBanco(bancoUrl, async (cliente) => {
    await cliente.query('begin')
    await cliente.query(`drop trigger if exists ${GATILHO_DA_FALHA} on job_registro`)
    await cliente.query(`create or replace function ${GATILHO_DA_FALHA}() returns trigger language plpgsql as $$ begin raise exception 'ensaio de alerta: falha forcada'; end $$`)
    await cliente.query(`create trigger ${GATILHO_DA_FALHA} before insert on job_registro for each row when (new.escola_id = '${escolaId}'::uuid) execute function ${GATILHO_DA_FALHA}()`)
    await cliente.query('commit')
  })
}

export async function removerGatilhoDaFalha(bancoUrl: string): Promise<void> {
  await comBanco(bancoUrl, async (cliente) => {
    await cliente.query(`drop trigger if exists ${GATILHO_DA_FALHA} on job_registro`)
    await cliente.query(`drop function if exists ${GATILHO_DA_FALHA}()`)
  })
}

export async function gatilhoDaFalhaExiste(bancoUrl: string): Promise<boolean> {
  return comBanco(bancoUrl, async (cliente) => {
    const { rows } = await cliente.query<{ existe: boolean }>('select exists (select 1 from pg_trigger where tgname = $1) or exists (select 1 from pg_proc where proname = $1) as existe', [GATILHO_DA_FALHA])
    return rows[0]?.existe === true
  })
}

/** O token da vez, de um usuário por volta: nenhum passa do próprio limite. */
function tokenDaVez(escola: EscolaDoEnsaio, volta: number): Promise<string> {
  const gerar = escola.tokens[volta % escola.tokens.length]
  return gerar === undefined ? Promise.resolve('') : gerar()
}

/**
 * Tráfego enquanto as condições valem: a cada segundo, um `POST` da escola da falha (que o gatilho recusa)
 * e uma leitura de contexto de outra escola (que o seguro limita). Usuários alternados, para nenhum passar
 * do próprio limite com o seguro dividindo o limite pelas instâncias.
 */
function iniciarTrafego(opcoes: OpcoesDoEnsaio, daFalha: EscolaDoEnsaio, doSeguro: EscolaDoEnsaio, statusDaFalha: Record<string, number>): { parar: () => Promise<void> } {
  let ativo = true
  const laco = (async () => {
    for (let volta = 0; ativo; volta++) {
      const inicio = Date.now()
      try {
        const falha = await criarJobSintetico(opcoes.apiUrl, await tokenDaVez(daFalha, volta), { fila: 'normal', cpuMs: 0 })
        statusDaFalha[String(falha.status)] = (statusDaFalha[String(falha.status)] ?? 0) + 1
        await falha.body?.cancel()
        const contexto = await fetch(`${opcoes.apiUrl}/v1/sistema/contexto`, { headers: { Authorization: `Bearer ${await tokenDaVez(doSeguro, volta)}` }, signal: AbortSignal.timeout(5_000) })
        await contexto.body?.cancel()
      } catch {
        statusDaFalha['sem_resposta'] = (statusDaFalha['sem_resposta'] ?? 0) + 1
      }
      await esperar(Math.max(0, 1_000 - (Date.now() - inicio)))
    }
  })()
  return {
    parar: async () => {
      ativo = false
      await laco
    },
  }
}

function descreverEstados(regras: Map<string, RegraNoGrafana>): string {
  return Object.values(REGRAS_DO_ENSAIO)
    .map((uid) => `${regras.get(uid)?.titulo ?? uid}: ${regras.get(uid)?.estado ?? 'ausente'}`)
    .join(' | ')
}

/** Nenhum alerta das três regras pendente, disparado ou em erro. */
function todasNormais(regras: Map<string, RegraNoGrafana>): boolean {
  return Object.values(REGRAS_DO_ENSAIO).every((uid) => {
    const regra = regras.get(uid)
    return regra !== undefined && regra.alertas.every((alerta) => alerta.estado === 'normal')
  })
}

export async function executarEnsaioDeAlertas(opcoes: OpcoesDoEnsaio): Promise<ResultadoDoEnsaio> {
  if (opcoes.ambiente['AMBIENTE'] !== 'local') throw new Error('o ensaio de alertas só roda com AMBIENTE=local: ele para serviço e força erro na API')
  const registrar = opcoes.registrar ?? (() => undefined)
  const prazoParaDisparar = opcoes.prazoParaDispararMs ?? 9 * 60_000
  const prazoParaNormalizar = opcoes.prazoParaNormalizarMs ?? 4 * 60_000
  const { sinal } = opcoes

  registrar('subindo os serviços do ensaio')
  await subir(opcoes, opcoes.servicos)
  // Um ensaio interrompido antes da limpeza não deixa o gatilho para este.
  await removerGatilhoDaFalha(opcoes.bancoUrl)

  await aguardar('as três regras provisionadas e normais antes de começar', prazoParaNormalizar, sinal, async () => {
    const regras = await lerRegrasNoGrafana(opcoes.grafanaUrl)
    registrar(`antes: ${descreverEstados(regras)}`)
    return todasNormais(regras) ? regras : undefined
  })

  const doJob = await opcoes.criarEscolaComSessoes(1)
  const daFalha = await opcoes.criarEscolaComSessoes(USUARIOS_POR_ESCOLA)
  const doSeguro = await opcoes.criarEscolaComSessoes(USUARIOS_POR_ESCOLA)
  const [escolaDoJob, escolaDaFalha, escolaDoSeguro] = [doJob.escolaId, daFalha.escolaId, doSeguro.escolaId]
  const statusDaFalha: Record<string, number> = {}
  const disparos: Partial<Record<UidDaRegra, DisparoObservado>> = {}
  let jobId = ''
  let jobDeOutraEscolaNaFalha = ''
  let trafego: { parar: () => Promise<void> } | undefined
  let erroDoEnsaio: unknown

  try {
    registrar('parando o worker-interativo e mandando um job interativo')
    await comandoOuFalha(opcoes, 'stop', ...WORKERS_INTERATIVOS)
    const resposta = await criarJobSintetico(opcoes.apiUrl, await tokenDaVez(doJob, 0), { fila: 'interativa', cpuMs: 0 })
    if (resposta.status !== 202) throw new Error(`o job interativo do ensaio não foi aceito (status ${resposta.status})`)
    jobId = ((await resposta.json()) as { jobId: string }).jobId

    registrar('parando o Redis de cache e forçando falha na rota sintética')
    await comandoOuFalha(opcoes, 'stop', 'redis-cache')
    await criarGatilhoDaFalha(opcoes.bancoUrl, escolaDaFalha)
    const outraEscola = await criarJobSintetico(opcoes.apiUrl, await tokenDaVez(doSeguro, 0), { fila: 'normal', cpuMs: 0 })
    if (outraEscola.status !== 202) throw new Error(`com o gatilho da falha, outra escola também não gravou job (status ${outraEscola.status})`)
    jobDeOutraEscolaNaFalha = ((await outraEscola.json()) as { jobId: string }).jobId
    trafego = iniciarTrafego(opcoes, daFalha, doSeguro, statusDaFalha)

    const esperados: Record<UidDaRegra, Record<string, string>> = {
      [REGRAS_DO_ENSAIO.jobInterativo]: { fila: 'interativa', escola_id: escolaDoJob },
      [REGRAS_DO_ENSAIO.seguroDoLimite]: {},
      [REGRAS_DO_ENSAIO.taxa5xx]: { job: 'educa/api', http_route: ROTA_DA_FALHA },
    }
    // A pendência de cada regra, anotada quando vista: o disparo só vale se veio depois dela e do `for:` inteiro.
    const pendencias: Partial<Record<UidDaRegra, number>> = {}
    await aguardar('as três regras disparadas', prazoParaDisparar, sinal, async () => {
      const regras = await lerRegrasNoGrafana(opcoes.grafanaUrl)
      registrar(`provocando: ${descreverEstados(regras)}`)
      for (const [uid, rotulos] of Object.entries(esperados) as Array<[UidDaRegra, Record<string, string>]>) {
        if (disparos[uid] !== undefined) continue
        const regra = regras.get(uid)
        const doEnsaio = (regra?.alertas ?? []).filter((candidato) => Object.entries(rotulos).every(([chave, valor]) => candidato.rotulos[chave] === valor))
        const pendente = doEnsaio.find((candidato) => candidato.estado === 'pendente')
        if (pendente?.desdeMs !== undefined) pendencias[uid] ??= pendente.desdeMs
        const disparado = doEnsaio.find((candidato) => candidato.estado === 'disparado')
        if (regra === undefined || disparado?.desdeMs === undefined) continue
        const pendenteDesdeMs = pendencias[uid]
        if (pendenteDesdeMs === undefined) throw new Error(`${regra.titulo} disparou sem o ensaio ter visto a regra pendente`)
        disparos[uid] = { rotulos: disparado.rotulos, pendenteDesdeMs, disparadoDesdeMs: disparado.desdeMs, duracaoS: regra.duracaoS }
        registrar(`disparou: ${regra.titulo}, ${Math.round((disparado.desdeMs - pendenteDesdeMs) / 1_000)} s depois de pendente (for: ${regra.duracaoS} s)`)
      }
      return Object.keys(disparos).length === Object.keys(esperados).length ? true : undefined
    })
  } catch (erro) {
    erroDoEnsaio = erro
  }

  // Com sucesso ou não, restaura tudo, e cada passo tenta mesmo que o anterior tenha falhado.
  registrar('restaurando: gatilho removido, Redis de cache e worker-interativo religados')
  const falhasDaRestauracao: unknown[] = []
  for (const passo of [() => trafego?.parar() ?? Promise.resolve(), () => removerGatilhoDaFalha(opcoes.bancoUrl), () => subir(opcoes, ['redis-cache', ...WORKERS_INTERATIVOS])]) {
    try {
      await passo()
    } catch (erro) {
      falhasDaRestauracao.push(erro)
    }
  }
  if (falhasDaRestauracao.length > 0) {
    registrar('a restauração falhou em algum passo: confira o gatilho, o Redis de cache e o worker-interativo')
    throw new AggregateError(erroDoEnsaio === undefined ? falhasDaRestauracao : [erroDoEnsaio, ...falhasDaRestauracao], 'restauração do ensaio de alertas incompleta')
  }
  if (erroDoEnsaio !== undefined) throw erroDoEnsaio

  await aguardar('as três regras de volta a normal', prazoParaNormalizar, sinal, async () => {
    const regras = await lerRegrasNoGrafana(opcoes.grafanaUrl)
    registrar(`restaurado: ${descreverEstados(regras)}`)
    return todasNormais(regras) ? true : undefined
  })
  return {
    escolaDoJob,
    escolaDaFalha,
    escolaDoSeguro,
    jobId,
    jobDeOutraEscolaNaFalha,
    disparos: disparos as Record<UidDaRegra, DisparoObservado>,
    normalizadoEmMs: Date.now(),
    statusDaFalha,
  }
}

function composeDoAmbienteLocal(...argumentos: string[]): Promise<ResultadoDeComando> {
  return new Promise((resolver) => {
    // O projeto de desenvolvimento, pelo compose.yaml da raiz, com as variáveis de .env.example.
    const processo = spawn('docker', ['compose', ...argumentos], { cwd: raizRepositorio })
    let saida = ''
    processo.stdout.on('data', (parte: Buffer) => (saida += parte.toString()))
    processo.stderr.on('data', (parte: Buffer) => (saida += parte.toString()))
    processo.on('error', () => resolver({ codigo: 127, saida }))
    processo.on('close', (codigo) => resolver({ codigo: codigo ?? 1, saida }))
  })
}

function obrigatoria(ambiente: Record<string, string | undefined>, chave: string): string {
  const valor = ambiente[chave]
  if (valor === undefined || valor === '') throw new Error(`defina ${chave} (npm run ensaio:alertas lê .env.example)`)
  return valor
}

async function executarPelaLinhaDeComando(): Promise<void> {
  const ambiente = process.env
  const controle = new AbortController()
  // Ctrl+C interrompe a espera e ainda restaura; o segundo encerra na hora.
  process.once('SIGINT', () => controle.abort())
  const importar = <T>(caminho: string) => import(pathToFileURL(join(raizRepositorio, caminho)).href) as Promise<T>
  const nucleo = await importar<{ criarBanco: typeof criarBanco; criarPool: typeof criarPool }>('packages/nucleo/dist/index.js')
  const escolas = await importar<{ criarRede: typeof criarRede; criarEscola: typeof criarEscola }>('apps/api/dist/ops/escola.js')
  const sessoes = await importar<{ criarSessoesSinteticas: typeof criarSessoesSinteticas; emissorDeTokenSintetico: typeof emissorDeTokenSintetico }>('apps/api/dist/sessao/sessoes-sinteticas.js')
  const inicio = Date.now()
  const escrever = (linha: string) => process.stdout.write(`[${Math.round((Date.now() - inicio) / 1_000)} s] ${linha}\n`)
  const bancoUrl = `postgres://${obrigatoria(ambiente, 'POSTGRES_USUARIO')}:${obrigatoria(ambiente, 'POSTGRES_SENHA')}@127.0.0.1:${obrigatoria(ambiente, 'POSTGRES_PORTA_HOST')}/${obrigatoria(ambiente, 'POSTGRES_BANCO')}`
  const pool = nucleo.criarPool({ url: bancoUrl, maximoConexoes: 1, timeoutConexaoMs: 5_000, timeoutConsultaMs: 30_000 }, () => undefined)
  const banco = nucleo.criarBanco(pool)
  // Escola e sessões sintéticas do ensaio, só no ambiente local (o ensaio e o emissor recusam outro), com o ensaio
  // como operador na auditoria delas.
  const criarEscolaComSessoes: CriarEscolaComSessoes = async (quantidade) => {
    const redeId = await escolas.criarRede(banco, OPERADOR_DO_ENSAIO, { nome: 'Rede sintética do ensaio', tipo: 'independente' })
    const escolaId = await escolas.criarEscola(banco, OPERADOR_DO_ENSAIO, { redeId, nome: 'Escola sintética do ensaio', slug: `ensaio-${randomUUID()}` })
    const emissor = sessoes.emissorDeTokenSintetico(ambiente)
    const criadas = await sessoes.criarSessoesSinteticas(banco, ambiente, { escolaId, papel: 'coordenador', quantidade })
    return { escolaId, tokens: criadas.map((criada) => async () => (await emissor.emitir({ escolaId, usuarioId: criada.usuarioId, sessaoId: criada.sessaoId })).token) }
  }
  try {
    await executarEnsaioDeAlertas({
      compose: composeDoAmbienteLocal,
      servicos: [],
      apiUrl: `http://127.0.0.1:${obrigatoria(ambiente, 'BORDA_PORTA_HOST')}`,
      grafanaUrl: `http://127.0.0.1:${obrigatoria(ambiente, 'GRAFANA_PORTA_HOST')}`,
      bancoUrl,
      ambiente,
      criarEscolaComSessoes,
      registrar: escrever,
      sinal: controle.signal,
    })
    escrever('ensaio concluído: as três regras dispararam e voltaram a normal')
  } catch (erro) {
    escrever(`ensaio falhou: ${erro instanceof Error ? erro.message : String(erro)}`)
    process.exitCode = 1
  } finally {
    await pool.end()
  }
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await executarPelaLinhaDeComando()
}
