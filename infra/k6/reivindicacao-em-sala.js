// Cenário "reivindicação em sala" (A1, tarefa 9.0; Tech Spec da A1, seção 7c; cenarios.md, K1 e K2; PRD, RF19; regra 80,
// itens 1, 7 e 11). Roda num container do compose de carga, na mesma rede: todos os VUs de um container saem do IP dele,
// como uma escola inteira atrás de um NAT. Quem o chama é infra/scripts/carga-sala.ts, uma vez por fase:
//
//   FASE=k1               seis turmas de 35 alunos (210) chegam em 5 min: abrem a turma pelo link ou pelo código,
//                         escolhem o nome, digitam a matrícula e criam a senha. 20% erram o código antes, 10% erram a
//                         matrícula antes, e dois alunos por turma mandam o pedido de dois computadores no mesmo
//                         segundo (a disputa pelo nome). O professor decide os pedidos em lotes de até 40, a cada 45 s,
//                         e cada aprovado entra logo depois, um depois do outro, pelo login por matrícula.
//   FASE=k2               o mesmo, no primeiro dia da escola inteira: 60 turmas, 2.100 alunos em 5 min, dez professores.
//   FASE=k2_redis_lento   o K2 menor (12 turmas, 420 alunos em 2 min, dois professores), com o Redis de fila respondendo
//                         devagar (o script pausa os clientes dele em ciclos): mede o `decidir`, que zera os contadores de
//                         login das aprovadas nesse Redis depois do lote.
//   FASE=outra_escola     só o login da outra escola, com requisições autenticadas: roda no SEGUNDO container, com IP
//                         próprio, ao mesmo tempo que o K1 e o K2. É a régua do login do F1: p95 abaixo de 1 s.
//
// A página imita a web (17.0): no 503 com `Retry-After`, repete o mesmo envio, com a mesma chave, até 3 vezes. Toda
// resposta soma no contador do seu grupo (1 no caso, 0 fora dele), para nenhum threshold passar por falta de amostra.
//
// Nenhum dado de pessoa: nomes e matrículas gerados pelo script de carga, e a senha sintética gerada na hora, lida de um
// arquivo da pasta temporária da execução. Nada chama provedor de IA nem o `oidc-falso`.

import { sleep } from 'k6'
import crypto from 'k6/crypto'
import { SharedArray } from 'k6/data'
import exec from 'k6/execution'
import http from 'k6/http'
import { Counter, Trend } from 'k6/metrics'

const FASE = __ENV.FASE
const API = __ENV.API_URL
const ARQUIVO_DAS_CONTAS = __ENV.ARQUIVO_DAS_CONTAS
const FASES = ['k1', 'k2', 'k2_redis_lento', 'outra_escola']
if (!FASES.includes(FASE)) throw new Error(`FASE precisa ser uma de: ${FASES.join(', ')}`)
if (!API || !ARQUIVO_DAS_CONTAS) throw new Error('defina API_URL e ARQUIVO_DAS_CONTAS')

/** p95 do login da outra escola: a régua do F1 (`docs/infra.md` 3.1 e 10; alerta `login-lento`). */
export const P95_MAXIMO_DO_LOGIN_MS = 1_000
/** p95 do `decidir` em lote de até 40: nada demorado dentro do request (regra 00, item 4). */
export const P95_MAXIMO_DO_DECIDIR_MS = 2_000
/** Quantas vezes a página repete o 503 com a mesma chave antes de mostrar "Tentar de novo" (Tech Spec da A1, seção 9). */
const REENVIOS_NO_503 = 3
/** O teto do `decidir` (`MAXIMO_DE_PEDIDOS_POR_DECISAO`). */
export const LOTE_DO_DECIDIR = 40
/** De quanto em quanto tempo o professor olha os pedidos e aprova os que chegaram. */
const CICLO_DO_PROFESSOR_S = 45
/** O alfabeto do código da turma (Tech Spec da A1, seção 3): o código errado é sorteado no formato. */
const ALFABETO_DO_CODIGO = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'

const conteudo = () => JSON.parse(open(ARQUIVO_DAS_CONTAS))
// Uma cópia para todos os VUs, e não uma por VU.
const [GERAL] = new SharedArray('geral', () => {
  const { senha, slug, chegadaS, esperaDosProfessoresS, slugOutra } = conteudo()
  return [{ senha, slug, chegadaS, esperaDosProfessoresS, slugOutra }]
})
const ALUNOS = new SharedArray('alunos', () => conteudo().alunos ?? [])
const TURMAS = new SharedArray('turmas', () => conteudo().turmas ?? [])
const PROFESSORES = new SharedArray('professores', () => conteudo().professores ?? [])
const OUTRA_ESCOLA = new SharedArray('outraEscola', () => conteudo().outraEscola ?? [])
const { senha: SENHA, slug: SLUG, chegadaS: CHEGADA_S, esperaDosProfessoresS: ESPERA_DOS_PROFESSORES_S, slugOutra: SLUG_OUTRA } = GERAL

const duracaoDoLogin = new Trend('login_duracao', true)
const duracaoDoDecidir = new Trend('decidir_duracao', true)
const duracaoDaSala = new Trend('sala_duracao', true)
const loteDoDecidir = new Trend('decidir_lote')
const autenticadaDuracao = new Trend('autenticada_duracao', true)
const respostas5xx = new Counter('respostas_5xx')
// Informativo: o 503 que a página repete. Ele também soma em `respostas_5xx`, que precisa ficar em zero.
const respostas503 = new Counter('respostas_503')
const inesperadas = new Counter('respostas_inesperadas')
const enviados = new Counter('pedidos_enviados')
const disputaErrada = new Counter('disputa_sem_um_vencedor')
const aprovados = new Counter('aprovados')
const aprovadoEntrou = new Counter('aprovado_entrou')
const loginErroFinal = new Counter('login_erro_final')
const entraram = new Counter('contas_que_entraram')

// ---------------------------------------------------------------------------------------------------------------------
// Cenários e thresholds de cada fase
// ---------------------------------------------------------------------------------------------------------------------

function configuracao() {
  if (FASE === 'outra_escola') {
    return {
      cenarios: {
        outra_escola: { executor: 'constant-arrival-rate', exec: 'outraEscola', rate: 1, timeUnit: '1s', duration: `${CHEGADA_S}s`, preAllocatedVUs: 20, maxVUs: 100 },
      },
      thresholds: {
        'login_duracao{grupo:outra_escola}': [`p(95)<${P95_MAXIMO_DO_LOGIN_MS}`],
        'login_erro_final{grupo:outra_escola}': ['count==0'],
        'contas_que_entraram{grupo:outra_escola}': ['count>0'],
        'respostas_5xx{grupo:outra_escola}': ['count==0'],
        'respostas_inesperadas{grupo:outra_escola}': ['count==0'],
        dropped_iterations: ['count==0'],
      },
    }
  }
  const alunos = ALUNOS.length
  const redisLento = FASE === 'k2_redis_lento'
  return {
    cenarios: {
      alunos: {
        executor: 'constant-arrival-rate',
        exec: 'aluno',
        rate: alunos,
        timeUnit: `${CHEGADA_S}s`,
        duration: `${CHEGADA_S}s`,
        preAllocatedVUs: Math.min(400, Math.ceil(alunos / 4)),
        maxVUs: 800,
      },
      professores: {
        executor: 'per-vu-iterations',
        exec: 'professor',
        vus: PROFESSORES.length,
        iterations: 1,
        maxDuration: `${CHEGADA_S + ESPERA_DOS_PROFESSORES_S + 120}s`,
      },
    },
    thresholds: {
      // Zero 5xx, em qualquer grupo, e nenhuma resposta fora do esperado (nada de 429 para quem está atrás do mesmo IP).
      respostas_5xx: ['count==0'],
      respostas_inesperadas: ['count==0'],
      // Zero duplicidade: cada aluno com um pedido enviado, cada disputa com um vencedor só, e cada nome aprovado uma vez.
      pedidos_enviados: [`count==${alunos}`],
      disputa_sem_um_vencedor: ['count==0'],
      aprovados: [`count==${alunos}`],
      // O `decidir` em lote de até 40 dentro dos 2 s, também com o Redis de fila devagar.
      decidir_duracao: [`p(95)<${P95_MAXIMO_DO_DECIDIR_MS}`],
      decidir_lote: [`max<=${LOTE_DO_DECIDIR}`],
      dropped_iterations: ['count==0'],
      // Com o Redis devagar, a entrada do aprovado é medida, e não cobrada: o corte do cliente Redis do login é o que ela
      // mede (runbook, "Seguro de limite ativo", causa 4).
      ...(redisLento ? {} : { aprovado_entrou: [`count==${alunos}`], 'login_erro_final{grupo:aprovado}': ['count==0'] }),
    },
  }
}

const { cenarios, thresholds } = configuracao()

export const options = {
  scenarios: cenarios,
  thresholds,
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
  // O nome da requisição agrupa: nenhuma URL com id vira série.
  systemTags: ['status', 'method', 'name', 'scenario', 'expected_response'],
}

// ---------------------------------------------------------------------------------------------------------------------
// A web, imitada
// ---------------------------------------------------------------------------------------------------------------------

const JSON_ = { 'Content-Type': 'application/json' }

/** Um UUID v4 sorteado: a `chaveEnvio` que a página sorteia a cada envio. */
function uuid() {
  const bytes = new Uint8Array(crypto.randomBytes(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

function codigoErrado() {
  return Array.from(new Uint8Array(crypto.randomBytes(8)), (byte) => ALFABETO_DO_CODIGO[byte % ALFABETO_DO_CODIGO.length]).join('')
}

/** Soma a resposta nos contadores do grupo: 5xx, 503 e a resposta fora do esperado. */
function contar(resposta, grupo, esperados) {
  respostas5xx.add(resposta.status >= 500 ? 1 : 0, { grupo })
  respostas503.add(resposta.status === 503 ? 1 : 0, { grupo })
  inesperadas.add(esperados.includes(resposta.status) ? 0 : 1, { grupo, status: String(resposta.status) })
}

function post(caminho, corpo, nome, grupo, token) {
  const headers = token === undefined ? JSON_ : { ...JSON_, Authorization: `Bearer ${token}` }
  return http.post(`${API}${caminho}`, JSON.stringify(corpo), { headers, tags: { name: nome, grupo }, responseCallback: http.expectedStatuses({ min: 200, max: 499 }) })
}

/** `salas/abrir` pelo link ou pelo código. */
function abrir(pelo) {
  const resposta = post('/v1/salas/abrir', { slug: SLUG, ...pelo }, 'POST /v1/salas/abrir', 'aluno')
  duracaoDaSala.add(resposta.timings.duration, { rota: 'abrir' })
  return resposta
}

/** Um envio de `salas/reivindicar`, como a página: no 503, repete com a mesma chave pelo `Retry-After`, até 3 vezes. */
function reivindicar(corpo) {
  let resposta
  for (let envio = 0; envio <= REENVIOS_NO_503; envio++) {
    resposta = post('/v1/salas/reivindicar', corpo, 'POST /v1/salas/reivindicar', 'aluno')
    duracaoDaSala.add(resposta.timings.duration, { rota: 'reivindicar' })
    contar(resposta, 'aluno', [200, 409, 503])
    if (resposta.status !== 503) return resposta
    const espera = Number(resposta.headers['Retry-After'])
    sleep(Number.isFinite(espera) && espera > 0 ? espera : 2)
  }
  return resposta
}

const recusada = (resposta) => resposta.status === 409 && resposta.json('erro.codigo') === 'REIVINDICACAO_RECUSADA'

/** Login por matrícula, repetindo o 503 como a web faz, por até 30 s. Devolve o token, ou `undefined`. */
function entrar(slug, matricula, grupo) {
  const inicio = Date.now()
  for (;;) {
    const resposta = post('/v1/sessao/matricula', { slug, matricula, senha: SENHA }, 'POST /v1/sessao/matricula', grupo)
    duracaoDoLogin.add(resposta.timings.duration, { grupo })
    contar(resposta, grupo, [200, 503])
    if (resposta.status === 503) {
      const espera = Number(resposta.headers['Retry-After'])
      const esperaS = Number.isFinite(espera) && espera > 0 ? espera : 2
      if (Date.now() - inicio + esperaS * 1_000 <= 30_000) {
        sleep(esperaS)
        continue
      }
    }
    const token = resposta.status === 200 ? resposta.json('token') : undefined
    const entrou = typeof token === 'string'
    loginErroFinal.add(entrou ? 0 : 1, { grupo })
    if (entrou) entraram.add(1, { grupo })
    return entrou ? token : undefined
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// O aluno
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Um aluno chega: abre a turma (errando o código antes, se é um dos 20%), acha o próprio nome na lista, e manda o pedido
 * (errando a matrícula antes, se é um dos 10%). Na disputa, o mesmo nome e a mesma matrícula saem de dois computadores
 * no mesmo segundo, cada um com a sua chave: um fica pendente, e o outro é recusado sem erro cru.
 */
export function aluno() {
  const conta = ALUNOS[exec.scenario.iterationInTest]
  if (conta === undefined) return
  const turma = TURMAS[conta.turma]
  if (conta.erraCodigo) contar(abrir({ codigo: codigoErrado() }), 'aluno', [404])
  const aberta = abrir(conta.peloCodigo ? { codigo: turma.codigo } : { token: turma.token })
  contar(aberta, 'aluno', [200])
  if (aberta.status !== 200) return
  const nome = (aberta.json('nomes') ?? []).find((item) => item.nome === conta.nome)
  inesperadas.add(nome === undefined ? 1 : 0, { grupo: 'aluno', status: 'nome_fora_da_lista' })
  if (nome === undefined) return
  const pelo = conta.peloCodigo ? { codigo: turma.codigo } : { token: turma.token }
  const pedido = (matricula) => ({ slug: SLUG, ...pelo, listaNomeId: nome.id, matricula, senha: SENHA, chaveEnvio: uuid() })

  if (conta.erraMatricula) {
    const errada = reivindicar(pedido(`errada-${uuid().slice(0, 8)}`))
    inesperadas.add(recusada(errada) || errada.status === 503 ? 0 : 1, { grupo: 'aluno', status: 'matricula_errada_aceita' })
  }

  if (conta.disputa) {
    const corpo = (chave) => ['POST', `${API}/v1/salas/reivindicar`, JSON.stringify({ ...pedido(conta.matricula), chaveEnvio: chave }), { headers: JSON_, tags: { name: 'POST /v1/salas/reivindicar', grupo: 'aluno' }, responseCallback: http.expectedStatuses({ min: 200, max: 499 }) }]
    const respostas = http.batch([corpo(uuid()), corpo(uuid())])
    for (const resposta of respostas) contar(resposta, 'aluno', [200, 409])
    const venceu = respostas.filter((resposta) => resposta.status === 200).length
    const perdeu = respostas.filter(recusada).length
    disputaErrada.add(venceu === 1 && perdeu === 1 ? 0 : 1)
    if (venceu === 1) enviados.add(1)
    return
  }

  const resposta = reivindicar(pedido(conta.matricula))
  const enviado = resposta.status === 200 && resposta.json('resultado') === 'enviado'
  inesperadas.add(enviado ? 0 : 1, { grupo: 'aluno', status: `envio_${resposta.status}` })
  if (enviado) enviados.add(1)
}

// ---------------------------------------------------------------------------------------------------------------------
// O professor
// ---------------------------------------------------------------------------------------------------------------------

/** Os pedidos pendentes das turmas do professor, com a matrícula de cada um lida da lista que o script de carga gerou. */
function pendentes(professor) {
  const todos = []
  for (const indice of professor.turmas) {
    const turma = TURMAS[indice]
    const resposta = http.get(`${API}/v1/turmas/${turma.id}/reivindicacoes?limite=100`, {
      headers: { Authorization: `Bearer ${professor.token}` },
      tags: { name: 'GET /v1/turmas/:id/reivindicacoes', grupo: 'professor' },
      responseCallback: http.expectedStatuses({ min: 200, max: 499 }),
    })
    contar(resposta, 'professor', [200])
    if (resposta.status !== 200) continue
    for (const item of resposta.json('itens') ?? []) todos.push({ id: item.id, matricula: turma.matriculas[item.nome] })
  }
  return todos
}

/**
 * O professor olha os pedidos das turmas dele a cada 45 s e aprova os que chegaram, em lotes de até 40 (`decidir`); cada
 * aprovado entra logo depois, um depois do outro, pelo login por matrícula, do mesmo IP da escola. Para quando aprovou todos os alunos das
 * turmas dele, ou no fim do prazo.
 */
export function professor() {
  // Uma iteração por VU: o número da iteração no cenário é o do professor.
  const eu = PROFESSORES[exec.scenario.iterationInTest]
  if (eu === undefined) return
  const esperados = eu.turmas.reduce((soma, indice) => soma + Object.keys(TURMAS[indice].matriculas).length, 0)
  const fim = Date.now() + (CHEGADA_S + ESPERA_DOS_PROFESSORES_S) * 1_000
  let aprovadosPorMim = 0
  while (aprovadosPorMim < esperados && Date.now() < fim) {
    sleep(CICLO_DO_PROFESSOR_S)
    const lista = pendentes(eu)
    for (let inicio = 0; inicio < lista.length; inicio += LOTE_DO_DECIDIR) {
      const lote = lista.slice(inicio, inicio + LOTE_DO_DECIDIR)
      const resposta = post('/v1/reivindicacoes/decidir', { ids: lote.map((pedido) => pedido.id), decisao: 'aprovar' }, 'POST /v1/reivindicacoes/decidir', 'professor', eu.token)
      duracaoDoDecidir.add(resposta.timings.duration)
      loteDoDecidir.add(lote.length)
      contar(resposta, 'professor', [200])
      if (resposta.status !== 200) continue
      const decididos = new Set((resposta.json('resultados') ?? []).filter((item) => item.resultado === 'decidida').map((item) => item.id))
      aprovados.add(decididos.size)
      aprovadosPorMim += decididos.size
      // O aprovado entra logo depois, do IP da escola: um depois do outro, como os alunos voltando à tela de entrada, e
      // repetindo o 503 como a web. Todos no mesmo milissegundo não é a sala: são 40 hashes de uma vez no semáforo.
      for (const pedido of lote) {
        if (!decididos.has(pedido.id)) continue
        if (entrar(SLUG, pedido.matricula, 'aprovado') !== undefined) aprovadoEntrou.add(1)
      }
    }
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// A outra escola
// ---------------------------------------------------------------------------------------------------------------------

/** Um aluno da outra escola entra por matrícula e faz três requisições autenticadas, de outro IP. */
export function outraEscola() {
  const matricula = OUTRA_ESCOLA[exec.scenario.iterationInTest % OUTRA_ESCOLA.length]
  const token = entrar(SLUG_OUTRA, matricula, 'outra_escola')
  if (token === undefined) return
  for (let vez = 0; vez < 3; vez++) {
    const resposta = http.get(`${API}/v1/sistema/contexto`, { headers: { Authorization: `Bearer ${token}` }, tags: { name: 'GET /v1/sistema/contexto', grupo: 'outra_escola' }, responseCallback: http.expectedStatuses(200) })
    autenticadaDuracao.add(resposta.timings.duration, { grupo: 'outra_escola' })
    contar(resposta, 'outra_escola', [200])
    sleep(1)
  }
}
