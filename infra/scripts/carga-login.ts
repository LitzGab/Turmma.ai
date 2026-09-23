import { randomBytes, randomUUID } from 'node:crypto'
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as esperar } from 'node:timers/promises'
import { pathToFileURL } from 'node:url'
import pg from 'pg'
import type { criarEscola, criarRede } from '../../apps/api/src/ops/escola.ts'
import type { HashDeSenha } from '../../apps/api/src/sessao/hash-de-senha.ts'
import type { criarAlunosComMatricula, criarSessoesSinteticas } from '../../apps/api/src/sessao/sessoes-sinteticas.ts'
import type { criarBanco, criarPool } from '@educa/nucleo'
import { raizRepositorio } from '../../tools/ci/executar.ts'
import { argumentosDoCompose, CODIGO_THRESHOLD_CRUZADO, lerAmbienteDeCarga, NOMES_DAS_ESCOLAS, rodar, type NomeDeEscola } from './carga.ts'
import { urlDoBancoDoAmbiente } from './conferir-carga.ts'
import { conferirCenarioDeLogin, descreverConferenciaDeLogin, type ConferenciaDoLogin, type JanelaDaFase } from './conferir-carga-login.ts'

/**
 * Cenário de carga "login às 7h30" (Tech Spec da identidade, seção 7c; PRD, RF11, RF13 e RF21; tarefa 16.0), local e
 * manual, como o "justiça entre escolas" do F0:
 *
 *   npm run carga:login                    sobe o compose de carga, roda as seis fases e reprova se um critério falhar
 *   npm run carga:login:controle-negativo  o mesmo, com LOGIN_PROTECAO_DESLIGADA=true, e reprova se o cenário passar
 *
 * 1. sobe o projeto `educa-carga` (infra/compose.yml com infra/compose.carga.yml: duas APIs com 1 CPU cada, a CPU de
 *    referência, e o argon2 calibrado de infra/carga.env);
 * 2. cria a rede e as escolas sintéticas A, B e C e, em cada uma, 680 alunos com matrícula e 20 professores com e-mail
 *    (2.100 contas), todos com a mesma senha sintética gerada agora, que só existe na pasta temporária da execução;
 * 3. roda o k6 fase a fase: base (B e C sem ataque, que dá o p95 de referência), rajada, renovação, ataque de fora (com
 *    um segundo container k6, de IP próprio), ataque de dentro (do IP da escola) e Redis de fila derrubado no meio de um
 *    ataque de fora e religado;
 * 4. confere no banco e no Prometheus o que o k6 não vê: nenhuma família encerrada por reuso, o rebaixamento só na A e
 *    só durante o ataque, o seguro em memória ligado com o Redis fora, e o 5xx do login na rajada (16.4);
 * 5. derruba o projeto com os volumes, passe ou não.
 *
 * O controle negativo roda só a base e os dois ataques, que é onde a proteção decide, e só passa se o cenário reprovar
 * pela proteção (B ou C degradadas, ou conta legítima da A recusada) com a base de pé.
 */

export const OPERADOR_DA_CARGA_DE_LOGIN = 'carga-login'
export const SCRIPT_DO_K6_DE_LOGIN = '/cenario/login-7h30.js'
/** As contas de cada escola: 680 alunos e 20 professores, 700 por escola, 2.100 no total. */
export const ALUNOS_POR_ESCOLA = 680
export const EQUIPE_POR_ESCOLA = 20
/** A rajada (Tech Spec, 7c): 30% das contas erram a senha uma vez antes de acertar. */
export const PROPORCAO_QUE_ERRA = 0.3
/** A matrícula sintética: a mesma sequência nas três escolas (matrícula repetida em escolas diferentes é normal). */
export function matriculaSintetica(posicao: number): string {
  return `2026${String(posicao).padStart(4, '0')}`
}

/**
 * As fases, na ordem. A `preparacao` não é da Tech Spec: sem ataque, as contas "com cookie" entram uma vez e o
 * `educa_dispositivo` delas vai para as fases de ataque (o navegador em que elas já tinham entrado).
 */
export const FASES_DO_CENARIO = ['base', 'rajada', 'renovacao', 'preparacao', 'ataque_fora', 'ataque_dentro', 'redis_fora'] as const
export type FaseDoCenario = (typeof FASES_DO_CENARIO)[number]
/** O controle negativo: a base, que precisa ficar de pé, a preparação e as fases em que a proteção decide. */
export const FASES_DO_CONTROLE_NEGATIVO = ['base', 'preparacao', 'ataque_fora', 'ataque_dentro'] as const satisfies readonly FaseDoCenario[]
/** As fases com o ataque saindo de outro container, que sobe junto com o do cenário. */
export const FASES_COM_ATACANTE_DE_FORA: readonly FaseDoCenario[] = ['ataque_fora', 'redis_fora']
const FASES_DE_ATAQUE: readonly FaseDoCenario[] = ['ataque_fora', 'ataque_dentro', 'redis_fora']
/** Na fase `redis_fora`, quando o Redis de fila cai e quando volta, contados do início do k6 (o ataque dura 3 min). */
export const REDIS_FORA_EM_S = 60
export const REDIS_DE_VOLTA_EM_S = 120

/**
 * Os critérios que os baldes e o rebaixamento sustentam, nas fases de ataque: B e C mantidas (login abaixo de 1 s,
 * autenticadas na margem, sem erro), a conta legítima da A e da equipe entrando sem 429 nem erro, e a com cookie com o
 * login abaixo de 1 s. É por eles, e só por
 * eles, que o controle negativo precisa reprovar.
 */
export const CRITERIOS_DA_PROTECAO = [
  'login_duracao{grupo:b}',
  'login_duracao{grupo:c}',
  'login_duracao{grupo:a_com_cookie}',
  'login_duracao{grupo:equipe_com_cookie}',
  'autenticada_duracao{grupo:b}',
  'autenticada_duracao{grupo:c}',
  'login_erro_final{grupo:b}',
  'login_erro_final{grupo:c}',
  'login_erro_final{grupo:a_com_cookie}',
  'login_erro_final{grupo:a_sem_cookie}',
  'login_erro_final{grupo:equipe_com_cookie}',
  'login_erro_final{grupo:equipe_sem_cookie}',
  'respostas_429{grupo:a_com_cookie}',
  'respostas_429{grupo:equipe_com_cookie}',
] as const

// ---------------------------------------------------------------------------------------------------------------------
// As contas do cenário
// ---------------------------------------------------------------------------------------------------------------------

export interface ContaDeMatricula {
  readonly escola: NomeDeEscola
  readonly matricula: string
}
export interface ContaDeEmail {
  readonly escola: NomeDeEscola
  readonly email: string
}
export type ContaDoCenario = (ContaDeMatricula | ContaDeEmail) & { readonly erra?: boolean }

/** O arquivo que o k6 lê (`ARQUIVO_DAS_CONTAS`): só identificadores sintéticos e a senha gerada nesta execução. */
export interface ContasDoCenario {
  readonly senha: string
  readonly senhaErrada: string
  readonly slugs: Record<NomeDeEscola, string>
  readonly rajada: readonly ContaDoCenario[]
  readonly renovacao: readonly ContaDoCenario[]
  readonly aComCookie: readonly ContaDeMatricula[]
  readonly aSemCookie: readonly ContaDeMatricula[]
  readonly bFundo: readonly ContaDeMatricula[]
  readonly cFundo: readonly ContaDeMatricula[]
  readonly equipeAlvo: ContaDeEmail
  readonly equipeSemCookie: readonly ContaDeEmail[]
  readonly alvosAtaqueMatricula: readonly string[]
  readonly alvosAtaqueEmail: readonly string[]
}

/** Os grupos de alunos da A: com cookie, sem cookie e os alvos do ataque, que nenhuma conta legítima usa. */
export const ALUNOS_DA_A_COM_COOKIE = 40
export const ALUNOS_DA_A_ALVO_DO_ATAQUE = 80
/** Os professores de cada escola que o ataque tenta, que nenhuma conta legítima usa (os últimos da lista). */
export const EQUIPE_ALVO_DO_ATAQUE_POR_ESCOLA = 5

/**
 * Monta as listas do k6 a partir das contas criadas. A rajada intercala as três escolas e a equipe, e marca 3 em cada
 * 10 contas para errar a senha uma vez; as listas dos ataques e as das contas legítimas não se cruzam: o ataque que
 * segura uma conta não pode ser confundido com a conta legítima recusada.
 */
export function montarContas(senha: string, senhaErrada: string, slugs: Record<NomeDeEscola, string>, emails: Record<NomeDeEscola, readonly string[]>): ContasDoCenario {
  const alunos = (escola: NomeDeEscola, de: number, ate: number): ContaDeMatricula[] =>
    Array.from({ length: ate - de }, (_, posicao) => ({ escola, matricula: matriculaSintetica(de + posicao) }))
  const equipe = (escola: NomeDeEscola): ContaDeEmail[] => emails[escola].map((email) => ({ escola, email }))

  const todas: ContaDoCenario[] = []
  const porEscola = NOMES_DAS_ESCOLAS.map((escola) => [...alunos(escola, 0, ALUNOS_POR_ESCOLA), ...equipe(escola)])
  const maior = Math.max(...porEscola.map((lista) => lista.length))
  for (let posicao = 0; posicao < maior; posicao++) {
    for (const lista of porEscola) {
      const conta = lista[posicao]
      if (conta !== undefined) todas.push(conta)
    }
  }
  // A equipe está no fim de cada lista: espalha as contas da equipe pela rajada inteira, em vez de deixá-las no fim.
  const rajada = espalhar(todas).map((conta, posicao) => ({ ...conta, erra: posicao % 10 < PROPORCAO_QUE_ERRA * 10 }))

  const [equipeAlvo] = equipe('A')
  if (equipeAlvo === undefined) throw new Error('a escola A precisa de equipe')
  const legitimaDaEquipe = (escola: NomeDeEscola) => equipe(escola).slice(1, -EQUIPE_ALVO_DO_ATAQUE_POR_ESCOLA)
  return {
    senha,
    senhaErrada,
    slugs,
    rajada,
    renovacao: NOMES_DAS_ESCOLAS.flatMap((escola) => alunos(escola, 0, 200)),
    aComCookie: alunos('A', 0, ALUNOS_DA_A_COM_COOKIE),
    aSemCookie: alunos('A', ALUNOS_DA_A_COM_COOKIE, ALUNOS_POR_ESCOLA - ALUNOS_DA_A_ALVO_DO_ATAQUE),
    bFundo: alunos('B', 0, 300),
    cFundo: alunos('C', 0, 300),
    equipeAlvo,
    equipeSemCookie: NOMES_DAS_ESCOLAS.flatMap(legitimaDaEquipe),
    alvosAtaqueMatricula: alunos('A', ALUNOS_POR_ESCOLA - ALUNOS_DA_A_ALVO_DO_ATAQUE, ALUNOS_POR_ESCOLA).map((conta) => conta.matricula),
    alvosAtaqueEmail: NOMES_DAS_ESCOLAS.flatMap((escola) => emails[escola].slice(-EQUIPE_ALVO_DO_ATAQUE_POR_ESCOLA)),
  }
}

/** Intercala a lista consigo mesma em passos primos: a ordem fica fixa, mas nenhum grupo fica concentrado no fim. */
function espalhar<T>(lista: readonly T[]): T[] {
  const passo = 37
  const vistas = new Set<number>()
  const saida: T[] = []
  for (let inicio = 0; saida.length < lista.length; inicio++) {
    for (let posicao = inicio; posicao < lista.length; posicao += passo) {
      if (vistas.has(posicao)) continue
      vistas.add(posicao)
      const item = lista[posicao]
      if (item !== undefined) saida.push(item)
    }
  }
  return saida
}

// ---------------------------------------------------------------------------------------------------------------------
// O k6 e o veredito
// ---------------------------------------------------------------------------------------------------------------------

export interface ResumoDaFase {
  readonly codigo: number
  /** Métrica com o threshold cruzado, como `login_duracao{grupo:b}`, e o critério. */
  readonly cruzados: ReadonlyArray<{ metrica: string; criterio: string }>
  /** Valores do resumo que vão para o registro da tarefa: p95 e contagens por grupo. */
  readonly valores: Readonly<Record<string, number>>
}

/** Lê o `--summary-export` do k6: `true` num threshold quer dizer cruzado. Guarda p95, máximo e contagem de cada métrica. */
export function lerResumoDaFase(codigo: number, resumo: unknown): ResumoDaFase {
  const metricas = typeof resumo === 'object' && resumo !== null && 'metrics' in resumo ? (resumo.metrics as Record<string, Record<string, unknown>>) : {}
  const cruzados = Object.entries(metricas).flatMap(([metrica, valores]) =>
    Object.entries((valores['thresholds'] ?? {}) as Record<string, boolean>)
      .filter(([, cruzado]) => cruzado)
      .map(([criterio]) => ({ metrica, criterio })),
  )
  const valores: Record<string, number> = {}
  for (const [metrica, dados] of Object.entries(metricas)) {
    for (const campo of ['p(95)', 'max', 'count']) {
      const valor = dados[campo]
      if (typeof valor === 'number') valores[`${metrica} ${campo}`] = valor
    }
  }
  return { codigo, cruzados, valores }
}

/** O p95 das requisições autenticadas da B e da C na base, a referência das fases seguintes. */
export function autenticadaBaseP95(base: ResumoDaFase): number | undefined {
  const valores = ['autenticada_duracao{grupo:b} p(95)', 'autenticada_duracao{grupo:c} p(95)'].map((chave) => base.valores[chave])
  if (valores.some((valor) => valor === undefined)) return undefined
  return Math.max(...(valores as number[]))
}

export interface Reprovacao {
  readonly criterio: string
  readonly detalhe: string
}

export interface VereditoDoLogin {
  readonly passou: boolean
  readonly reprovacoes: readonly Reprovacao[]
  /** Reprovou por um critério da proteção numa fase de ataque, com a base de pé e todo k6 rodado até o fim. */
  readonly reprovadoPelaProtecao: boolean
}

/**
 * Junta o k6 de cada fase e a conferência num veredito. Fase pedida que não rodou reprova: o ambiente nem chegou lá. O
 * código de saída do k6 e o resumo precisam concordar (99 com threshold cruzado, 0 sem): outro código é o k6 que não
 * rodou até o fim.
 */
export function julgarCenarioDeLogin(
  fases: readonly FaseDoCenario[],
  resumos: ReadonlyMap<FaseDoCenario, ResumoDaFase>,
  conferencia: ConferenciaDoLogin | undefined,
): VereditoDoLogin {
  const reprovacoes: Reprovacao[] = []
  for (const fase of fases) {
    const resumo = resumos.get(fase)
    if (resumo === undefined) {
      reprovacoes.push({ criterio: `${fase}:k6`, detalhe: `${fase}: a fase não rodou` })
      continue
    }
    for (const { metrica, criterio } of resumo.cruzados) reprovacoes.push({ criterio: `${fase}:${metrica}`, detalhe: `${fase}: ${metrica} ${criterio}` })
    const saidaEsperada = resumo.cruzados.length > 0 ? CODIGO_THRESHOLD_CRUZADO : 0
    if (resumo.codigo !== saidaEsperada) reprovacoes.push({ criterio: `${fase}:k6`, detalhe: `${fase}: k6 saiu com ${resumo.codigo}, e o resumo pedia ${saidaEsperada}` })
  }
  if (conferencia === undefined) reprovacoes.push({ criterio: 'conferencia', detalhe: 'a conferência no banco e no Prometheus não rodou' })
  else for (const motivo of conferencia.reprovacoes) reprovacoes.push({ criterio: 'conferencia', detalhe: `conferência: ${motivo}` })

  // O controle negativo só vale com a base de pé e com todo k6 tendo rodado até o fim, com saída e resumo de acordo.
  const baseLimpa = resumos.has('base') && !reprovacoes.some((reprovacao) => reprovacao.criterio.startsWith('base:') || reprovacao.criterio.endsWith(':k6'))
  const daProtecao: readonly string[] = CRITERIOS_DA_PROTECAO
  const pelaProtecao = reprovacoes.some((reprovacao) => {
    const [fase, metrica] = reprovacao.criterio.split(/:(.*)/s)
    return FASES_DE_ATAQUE.includes(fase as FaseDoCenario) && daProtecao.includes(metrica ?? '')
  })
  return { passou: reprovacoes.length === 0, reprovacoes, reprovadoPelaProtecao: baseLimpa && pelaProtecao }
}

/** Zero quando o cenário faz o que se espera dele: passar com a proteção, e reprovar pela proteção sem ela. */
export function codigoDeSaidaDoLogin(veredito: VereditoDoLogin, controleNegativo: boolean): number {
  if (controleNegativo) return veredito.reprovadoPelaProtecao ? 0 : 1
  return veredito.passou ? 0 : 1
}

/** Os argumentos do `k6 run` de uma fase, dentro do container. */
export function argumentosDoK6DeLogin(fase: FaseDoCenario | 'atacante', autenticadaBaseP95Ms?: number): string[] {
  return [
    'run',
    '--quiet',
    '--no-usage-report',
    '--summary-export',
    `/execucao/resumo-${fase}.json`,
    '--env',
    `FASE=${fase}`,
    '--env',
    'API_URL=http://borda:8080',
    '--env',
    'ARQUIVO_DAS_CONTAS=/execucao/contas.json',
    ...(autenticadaBaseP95Ms === undefined ? [] : ['--env', `AUTENTICADA_BASE_P95_MS=${Math.ceil(autenticadaBaseP95Ms)}`]),
    SCRIPT_DO_K6_DE_LOGIN,
  ]
}

// ---------------------------------------------------------------------------------------------------------------------
// A execução
// ---------------------------------------------------------------------------------------------------------------------

function escrever(linha: string): void {
  process.stdout.write(`${linha}\n`)
}

interface ModulosDaApi {
  nucleo: { criarBanco: typeof criarBanco; criarPool: typeof criarPool }
  escolas: { criarRede: typeof criarRede; criarEscola: typeof criarEscola }
  sessoes: { criarAlunosComMatricula: typeof criarAlunosComMatricula; criarSessoesSinteticas: typeof criarSessoesSinteticas }
  hash: { HashDeSenha: typeof HashDeSenha }
}

/** Os módulos já compilados da API (o `npm run carga:login` compila antes), como o `ensaio:alertas`. */
async function importarDaApi(): Promise<ModulosDaApi> {
  const importar = <T>(caminho: string) => import(pathToFileURL(join(raizRepositorio, caminho)).href) as Promise<T>
  return {
    nucleo: await importar('packages/nucleo/dist/index.js'),
    escolas: await importar('apps/api/dist/ops/escola.js'),
    sessoes: await importar('apps/api/dist/sessao/sessoes-sinteticas.js'),
    hash: await importar('apps/api/dist/sessao/hash-de-senha.js'),
  }
}

/**
 * Cria rede, escolas e as 2.100 contas no banco do projeto de carga, pelos mesmos serviços do seed e do
 * `ops:sessao-sintetica` (só com `AMBIENTE=local`). O hash é gerado uma vez, com os parâmetros calibrados do ambiente
 * da carga, e vale para todas as contas.
 */
async function semearContas(doArquivo: Record<string, string>): Promise<ContasDoCenario> {
  const { nucleo, escolas: ops, sessoes, hash } = await importarDaApi()
  const pool = nucleo.criarPool({ url: urlDoBancoDoAmbiente(doArquivo), maximoConexoes: 2, timeoutConexaoMs: 5_000, timeoutConsultaMs: 120_000 }, () => undefined)
  const banco = nucleo.criarBanco(pool)
  try {
    const senha = randomBytes(18).toString('base64url')
    const senhaErrada = randomBytes(18).toString('base64url')
    const senhaHash = await (await hash.HashDeSenha.criar({ memoriaKib: Number(doArquivo['LOGIN_ARGON2_MEMORIA_KIB']), iteracoes: Number(doArquivo['LOGIN_ARGON2_ITERACOES']) })).gerar(senha)
    const redeId = await ops.criarRede(banco, OPERADOR_DA_CARGA_DE_LOGIN, { nome: 'Rede sintética do login', tipo: 'independente' })
    const slugs = {} as Record<NomeDeEscola, string>
    const emails = {} as Record<NomeDeEscola, string[]>
    for (const nome of NOMES_DAS_ESCOLAS) {
      const slug = `login-${nome.toLowerCase()}-${randomUUID()}`
      const escolaId = await ops.criarEscola(banco, OPERADOR_DA_CARGA_DE_LOGIN, { redeId, nome: `Escola sintética ${nome}`, slug })
      slugs[nome] = slug
      await sessoes.criarAlunosComMatricula(banco, doArquivo, escolaId, Array.from({ length: ALUNOS_POR_ESCOLA }, (_, posicao) => ({ matricula: matriculaSintetica(posicao), senhaHash })))
      const equipe = await sessoes.criarSessoesSinteticas(banco, doArquivo, { escolaId, papel: 'professor', quantidade: EQUIPE_POR_ESCOLA })
      // O professor sintético nasce com conta sem senha: a senha da carga entra aqui, e o e-mail (`.invalid`) sai para o k6.
      const { rows } = await pool.query<{ email: string }>(
        `update conta set senha_hash = $1
           from usuario
          where usuario.conta_id = conta.id and usuario.id = any($2::uuid[])
      returning conta.email`,
        [senhaHash, equipe.map((professor) => professor.usuarioId)],
      )
      emails[nome] = rows.map((linha) => linha.email).sort()
    }
    return montarContas(senha, senhaErrada, slugs, emails)
  } finally {
    await pool.end()
  }
}

/**
 * As fases pedidas na linha de comando (`--fases base,rajada`), para depurar uma fase sem rodar o cenário inteiro; sem a
 * opção, todas (ou as do controle negativo). A base entra sempre, porque as outras comparam com ela, e a preparação
 * entra com qualquer ataque. O resultado de uma execução parcial não vale como registro da tarefa.
 */
export function fasesPedidas(argumentos: readonly string[], controleNegativo: boolean): readonly FaseDoCenario[] {
  const todas: readonly FaseDoCenario[] = controleNegativo ? FASES_DO_CONTROLE_NEGATIVO : FASES_DO_CENARIO
  const indice = argumentos.indexOf('--fases')
  if (indice < 0) return todas
  const pedidas = (argumentos[indice + 1] ?? '').split(',').filter((fase) => fase !== '')
  const desconhecida = pedidas.find((fase) => !todas.some((aceita) => aceita === fase))
  if (pedidas.length === 0 || desconhecida !== undefined) throw new Error(`--fases aceita só: ${todas.join(', ')}`)
  const comAtaque = pedidas.some((fase) => FASES_DE_ATAQUE.includes(fase as FaseDoCenario))
  return todas.filter((fase) => fase === 'base' || (fase === 'preparacao' && comAtaque) || pedidas.includes(fase))
}

async function executar(controleNegativo: boolean, fases: readonly FaseDoCenario[]): Promise<number> {
  const pasta = mkdtempSync(join(tmpdir(), 'educa-carga-login-'))
  // O k6 do container roda com outro usuário: ele lê as contas e grava o resumo nesta pasta.
  chmodSync(pasta, 0o777)
  const doArquivo = lerAmbienteDeCarga()
  const ambiente: NodeJS.ProcessEnv = {
    ...Object.fromEntries(Object.entries(process.env).filter(([chave]) => !(chave in doArquivo))),
    CARGA_PASTA_DA_EXECUCAO: pasta,
    LOGIN_PROTECAO_DESLIGADA: controleNegativo ? 'true' : 'false',
  }
  const compose = (...argumentos: string[]) => rodar('docker', [...argumentosDoCompose(), ...argumentos], ambiente)
  const inicio = new Date()
  let veredito: VereditoDoLogin | undefined
  try {
    escrever(`\n▶ cenário "login às 7h30"${controleNegativo ? ', controle negativo (LOGIN_PROTECAO_DESLIGADA=true)' : ''}: ${fases.join(', ')}`)
    await compose('down', '--volumes', '--remove-orphans')
    const subida = await compose('up', '--detach', '--build', '--wait')
    if (subida.codigo !== 0) throw new Error('o compose de carga não subiu')

    escrever('\n▶ escolas e contas do cenário')
    const contas = await semearContas(doArquivo)
    const arquivo = join(pasta, 'contas.json')
    writeFileSync(arquivo, JSON.stringify(contas))
    chmodSync(arquivo, 0o644)

    const k6 = async (fase: FaseDoCenario | 'atacante', autenticadaBaseP95Ms?: number): Promise<ResumoDaFase> => {
      const { codigo } = await compose('run', '--rm', '--no-deps', fase === 'atacante' ? 'k6-atacante' : 'k6', ...argumentosDoK6DeLogin(fase, autenticadaBaseP95Ms))
      let resumo: unknown
      try {
        resumo = JSON.parse(readFileSync(join(pasta, `resumo-${fase}.json`), 'utf8'))
      } catch {
        resumo = undefined
      }
      return lerResumoDaFase(codigo, resumo)
    }

    const resumos = new Map<FaseDoCenario, ResumoDaFase>()
    const janelas: JanelaDaFase[] = []
    let base: number | undefined
    for (const fase of fases) {
      if (fase !== 'base' && base === undefined) break
      escrever(`\n▶ k6, fase ${fase}`)
      const comeco = new Date()
      const atacante = FASES_COM_ATACANTE_DE_FORA.includes(fase) ? k6('atacante') : undefined
      const redis = fase === 'redis_fora' ? derrubarRedisDeFila(compose) : undefined
      const resumo = await k6(fase, base)
      const doAtacante = await atacante
      await redis
      resumos.set(fase, doAtacante === undefined ? resumo : juntarAtacante(resumo, doAtacante))
      janelas.push({ fase, inicio: comeco, fim: new Date() })
      if (fase === 'base') {
        base = autenticadaBaseP95(resumo)
        escrever(`p95 das autenticadas da B e da C na base: ${base === undefined ? '-' : `${Math.round(base)} ms`}`)
      }
    }

    escrever('\n▶ conferência no banco e no Prometheus')
    // As métricas saem a cada TELEMETRIA_INTERVALO_MS: espera a última exportação de cada instância chegar.
    await esperar(3 * Number(doArquivo['TELEMETRIA_INTERVALO_MS'] ?? '5000'))
    const cliente = new pg.Client({ connectionString: urlDoBancoDoAmbiente(doArquivo) })
    await cliente.connect()
    let conferencia: ConferenciaDoLogin
    try {
      conferencia = await conferirCenarioDeLogin({ banco: cliente, prometheus: `http://127.0.0.1:${doArquivo['PROMETHEUS_PORTA_HOST'] ?? ''}`, janelas, slugs: contas.slugs })
    } finally {
      await cliente.end()
    }
    for (const linha of descreverConferenciaDeLogin(conferencia)) escrever(linha)
    for (const [fase, resumo] of resumos) for (const linha of descreverFase(fase, resumo)) escrever(linha)
    veredito = julgarCenarioDeLogin(fases, resumos, conferencia)
  } catch (erro) {
    escrever(`\n✖ o cenário não terminou: ${erro instanceof Error ? erro.message : String(erro)}`)
    await compose('logs', '--no-color', '--tail', '100')
  } finally {
    await compose('down', '--volumes', '--remove-orphans')
    rmSync(pasta, { recursive: true, force: true })
  }

  const duracao = Math.round((Date.now() - inicio.getTime()) / 60_000)
  if (veredito === undefined) return 1
  escrever(`\n■ resultado em ${inicio.toISOString()} (${duracao} min): ${veredito.passou ? 'passou' : 'reprovou'}`)
  for (const reprovacao of veredito.reprovacoes) escrever(`  reprovado: ${reprovacao.detalhe}`)
  const codigo = codigoDeSaidaDoLogin(veredito, controleNegativo)
  if (controleNegativo) {
    escrever(codigo === 0 ? '✔ controle negativo: sem a proteção do login, o cenário reprovou pela proteção' : '✖ controle negativo: sem a proteção do login, o cenário não reprovou pela proteção')
  } else {
    escrever(codigo === 0 ? '✔ cenário passou' : '✖ cenário reprovou')
  }
  return codigo
}

/** O resumo do atacante entra na fase: o threshold dele (o ataque chegou inteiro) reprova a fase como os outros. */
export function juntarAtacante(fase: ResumoDaFase, atacante: ResumoDaFase): ResumoDaFase {
  const codigo = fase.codigo !== 0 ? fase.codigo : atacante.codigo
  return {
    codigo,
    cruzados: [...fase.cruzados, ...atacante.cruzados.map(({ metrica, criterio }) => ({ metrica: `atacante:${metrica}`, criterio }))],
    valores: { ...fase.valores, ...Object.fromEntries(Object.entries(atacante.valores).map(([chave, valor]) => [`atacante:${chave}`, valor])) },
  }
}

/** Derruba o Redis de fila no meio do ataque e o religa, contando do início do k6 da fase. */
async function derrubarRedisDeFila(compose: (...argumentos: string[]) => Promise<{ codigo: number }>): Promise<void> {
  await esperar(REDIS_FORA_EM_S * 1_000)
  escrever('  Redis de fila parado')
  await compose('stop', 'redis-fila')
  await esperar((REDIS_DE_VOLTA_EM_S - REDIS_FORA_EM_S) * 1_000)
  await compose('start', 'redis-fila')
  escrever('  Redis de fila religado')
}

/**
 * As linhas do registro de uma fase: p95 do login e das autenticadas, o tempo até entrar da A e da equipe sob ataque, e
 * contagens de 429, 503 e erro por grupo.
 */
export function descreverFase(fase: FaseDoCenario, resumo: ResumoDaFase): string[] {
  const linhas = Object.entries(resumo.valores)
    .filter(([chave]) => /^(atacante:)?(login_duracao\{grupo:[^}]+\} (p\(95\)|max)|ate_entrar_[a-z_]+ (p\(95\)|max)|autenticada_duracao\{grupo:[^}]+\} p\(95\)|(respostas_429|respostas_503|login_erro_final|contas_que_entraram|renovacao_409|renovacao_recusada|ataque_enviado)(\{grupo:[^}]+\})? count|dropped_iterations count)$/.test(chave))
    .map(([chave, valor]) => `  ${fase}: ${chave} = ${Math.round(valor)}`)
  return [`\n${fase}:`, ...linhas]
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const controleNegativo = process.argv.includes('--controle-negativo')
  process.exitCode = await executar(controleNegativo, fasesPedidas(process.argv.slice(2), controleNegativo))
}
