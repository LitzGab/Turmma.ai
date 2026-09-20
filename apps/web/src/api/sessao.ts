import {
  CodigoDeErro,
  esquemaRespostaLogin,
  esquemaRespostaRenovacao,
  JANELA_DE_RENOVACAO_SIMULTANEA_MS,
  type PedidoLoginEmail,
  type RespostaLogin,
  type RespostaRenovacao,
} from '@educa/shared'
import { chamarApi, ErroDaApi, SEM_CORPO, type EsquemaDeResposta, type OpcoesDaChamada } from './cliente'

export const CAMINHO_DA_SESSAO = '/v1/sessao'
export const CAMINHO_DA_RENOVACAO = `${CAMINHO_DA_SESSAO}/renovar`
export const CAMINHO_DA_ENTRADA_POR_EMAIL = `${CAMINHO_DA_SESSAO}/email`

/** A trava das Web Locks: uma renovação por vez no navegador inteiro, contando todas as abas abertas na escola. */
export const NOME_DA_TRAVA_DE_RENOVACAO = 'educa-renovacao'

/**
 * Quanto a web espera, depois de um 409 `JA_RENOVADO`, antes de tentar a renovação outra vez. Precisa passar da
 * janela da API (Tech Spec, seção 5, "Renovar"): dentro dela o cookie anterior é tratado como outra aba renovando
 * junto e recebe 409 de novo, e a segunda recusa mandaria a pessoa para o login no meio da aula. A folga cobre a
 * diferença entre o relógio do servidor e o daqui.
 */
export const ESPERA_DEPOIS_DO_JA_RENOVADO_MS = JANELA_DE_RENOVACAO_SIMULTANEA_MS + 500

/**
 * Por quanto tempo a entrada repete sozinha o 503 do semáforo do login antes de mostrar erro (Tech Spec, seção 5,
 * "Fila"): na rajada das 7h30 o 503 é atraso, e não recusa, e o botão fica em "Entrando…".
 */
export const PRAZO_DA_ENTRADA_NO_503_MS = 30_000

/**
 * O piso da espera entre duas tentativas no 503, qualquer que seja o `Retry-After` recebido. A nossa API nunca manda
 * menos de 1 s (`packages/nucleo/src/limite/chaves.ts`), mas quem obedece a um cabeçalho sem conferi-lo repete sem
 * intervalo se ele vier zerado — e aí a escola inteira, atrás do mesmo IP, martela justamente a rota que o semáforo
 * está protegendo às 7h30 (regra 80, itens 1 e 4).
 */
export const ESPERA_MINIMA_NO_503_MS = 1_000

/** Quanto o "Sair" espera antes da única repetição do `DELETE /v1/sessao`. */
export const ESPERA_ENTRE_TENTATIVAS_DE_SAIDA_MS = 1_000

/**
 * O estado da sessão nesta aba, que decide o que a rota protegida mostra:
 * - `desconhecida`: a aba acabou de abrir e ainda não se sabe se o cookie de renovação vale;
 * - `abrindo`: a renovação pelo cookie está em andamento;
 * - `aberta`: há token de acesso em memória;
 * - `anonima`: não há sessão, e a tela de entrada é o caminho;
 * - `indisponivel`: a API não respondeu (5xx ou sem rede). Não é logout: o caminho é tentar de novo.
 */
export type EstadoDaSessao = 'desconhecida' | 'abrindo' | 'aberta' | 'anonima' | 'indisponivel'

/**
 * O token de acesso vive só aqui, em variável de módulo, e some quando a aba fecha ou recarrega (regra 50, item 7):
 * o Chromebook do carrinho passa por quatro turmas por dia, e nada do aluno anterior pode ficar em `localStorage`,
 * `sessionStorage`, cookie legível ou URL. Quem guarda a sessão entre recargas é o cookie `HttpOnly` da renovação,
 * que o JavaScript da página não lê.
 */
let token: string | undefined
let expiraEm: number | undefined
let estado: EstadoDaSessao = 'desconhecida'
/** A falha que deixou a sessão `indisponivel`, para a tela dizer o que fazer pelo código dela. */
let ultimoErro: unknown

/**
 * Se o último "Sair" chegou à API. Quando não chega, esta aba esquece o token, mas o cookie de renovação continua
 * valendo no servidor: quem ficar no computador volta à sessão da pessoa anterior com um F5. A tela de entrada avisa,
 * em vez de apresentar a saída como concluída.
 */
let saidaConfirmada = true

const ouvintes = new Set<() => void>()

/**
 * O que precisa ser esquecido junto com a sessão, fora deste módulo: hoje, o cache do TanStack Query (`main.tsx`).
 * Sem isso, a pessoa seguinte no Chromebook do carrinho entraria e veria o nome e a escola da anterior, que ficam no
 * cache de `/v1/eu` por minutos depois da saída (regra 20, itens 4 e 5; regra 10, item 1).
 */
const aoEncerrar = new Set<() => void>()

/** Registra o que limpar em todo fim de sessão, em qualquer caminho. Devolve o cancelamento. */
export function aoEncerrarSessao(ouvinte: () => void): () => void {
  aoEncerrar.add(ouvinte)
  return () => {
    aoEncerrar.delete(ouvinte)
  }
}

function anunciar(): void {
  for (const ouvinte of ouvintes) ouvinte()
}

/** Assina a mudança de estado da sessão (`useSyncExternalStore`). Devolve o cancelamento. */
export function assinarSessao(ouvinte: () => void): () => void {
  ouvintes.add(ouvinte)
  return () => {
    ouvintes.delete(ouvinte)
  }
}

export function estadoDaSessao(): EstadoDaSessao {
  return estado
}

/** A falha da última tentativa de abrir a sessão, quando o estado é `indisponivel`. */
export function erroDaSessao(): unknown {
  return ultimoErro
}

/** O último "Sair" não foi confirmado pela API, e a sessão pode continuar viva no servidor. */
export function saidaPendente(): boolean {
  return !saidaConfirmada
}

export function tokenDeAcesso(): string | undefined {
  return token
}

function definirEstado(novo: EstadoDaSessao): void {
  if (estado === novo) return
  estado = novo
  anunciar()
}

function guardarToken(resposta: RespostaRenovacao): void {
  token = resposta.token
  expiraEm = new Date(resposta.expiraEm).getTime()
  estado = 'aberta'
  ultimoErro = undefined
  saidaConfirmada = true
  anunciar()
}

/**
 * Esquece a sessão desta aba, em qualquer caminho: "Sair", `NAO_AUTENTICADO` que persiste depois da renovação, ou
 * cookie que não vale mais. O cookie de renovação é apagado pela API, em `DELETE /v1/sessao`.
 *
 * Idempotente de propósito: o cache limpo faz a tela que ainda estava montada buscar de novo e receber outro
 * `NAO_AUTENTICADO`, e um segundo encerramento não pode reiniciar a limpeza.
 */
function esquecerSessao(): void {
  if (token === undefined && estado === 'anonima') return
  token = undefined
  expiraEm = undefined
  estado = 'anonima'
  // Avisa antes de limpar: assim o React já tem o desmonte da área autenticada agendado quando o cache esvazia, e
  // nenhum observador ainda montado recria a consulta que acabou de sair.
  anunciar()
  for (const ouvinte of aoEncerrar) ouvinte()
}

function esperar(ms: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, ms))
}

/** O erro da API com aquele código, ou `undefined`: é por ele que se lê também o `Retry-After`. */
function erroDaApi(erro: unknown, codigo: CodigoDeErro): ErroDaApi | undefined {
  return erro instanceof ErroDaApi && erro.codigo === codigo ? erro : undefined
}

function ehCodigo(erro: unknown, codigo: CodigoDeErro): boolean {
  return erroDaApi(erro, codigo) !== undefined
}

function rotacionar(): Promise<RespostaRenovacao> {
  return chamarApi(CAMINHO_DA_RENOVACAO, esquemaRespostaRenovacao, { metodo: 'POST' })
}

/**
 * Uma renovação por vez no navegador inteiro, pelas Web Locks: duas abas com o token vencido renovam em fila, e a
 * segunda já manda o cookie que a primeira recebeu. Sem a trava, as duas mandariam o mesmo cookie ao mesmo tempo e
 * uma delas acabaria em reuso de refresh, que encerra a família inteira e desloga a professora no meio da aula.
 *
 * `navigator.locks` existe em todo navegador que o build alcança (Chrome 69, Firefox 96, Safari 15.4). Sem ele — um
 * navegador mais antigo, ou o teste de unidade fora do navegador — a fila vale só nesta aba, e o resto do caminho
 * (409 e resposta perdida) continua cobrindo o caso.
 */
function comTravaDeRenovacao<T>(tarefa: () => Promise<T>): Promise<T> {
  const travas = globalThis.navigator?.locks as LockManager | undefined
  return travas === undefined ? tarefa() : travas.request(NOME_DA_TRAVA_DE_RENOVACAO, tarefa)
}

/**
 * A renovação pelo cookie, com as duas recusas que não são logout (Tech Spec, seção 5, "Renovar"):
 *
 * - **409 `JA_RENOVADO`:** outra aba acabou de rotacionar (e o navegador já tem o cookie novo), ou a resposta da
 *   nossa própria renovação se perdeu (e o cookie ainda é o anterior). As duas chegam à API iguais, e só o tempo as
 *   separa: passada a janela, a API rotaciona de novo no segundo caso. Por isso espera e tenta mais uma vez.
 * - **Sem rede ou 5xx:** sobe como `INDISPONIVEL_TENTE_DE_NOVO`, e quem chamou mantém token, tela e formulário.
 */
async function pedirRenovacao(): Promise<RespostaRenovacao> {
  try {
    return await rotacionar()
  } catch (erro) {
    if (!ehCodigo(erro, CodigoDeErro.JA_RENOVADO)) throw erro
    await esperar(ESPERA_DEPOIS_DO_JA_RENOVADO_MS)
    return rotacionar()
  }
}

let renovacaoEmAndamento: Promise<void> | undefined

/**
 * Renova a sessão pelo cookie e guarda o token novo. Uma só renovação por vez nesta aba (as chamadas que caíram em
 * 401 juntas esperam a mesma), e uma só no navegador (Web Locks).
 */
export function renovarSessao(): Promise<void> {
  // Sessão já encerrada nesta aba: renovar aqui ressuscitaria, pelo cookie que pode ter sobrevivido a um "Sair" que
  // a API não confirmou, justamente a sessão que a pessoa acabou de encerrar — e apagaria o aviso disso. Quem abre a
  // aba de novo passa por `abrirSessaoPeloCookie`, que sai de `desconhecida`, e o login passa por `guardarToken`.
  if (estado === 'anonima') return Promise.reject(new ErroDaApi(CodigoDeErro.NAO_AUTENTICADO))
  renovacaoEmAndamento ??= comTravaDeRenovacao(pedirRenovacao)
    .then(guardarToken)
    .finally(() => {
      renovacaoEmAndamento = undefined
    })
  return renovacaoEmAndamento
}

/**
 * Abre a sessão desta aba pelo cookie de renovação, ao carregar a página. Idempotente: chamar de novo enquanto a
 * renovação está em andamento espera a mesma.
 *
 * - Sessão válida: fica `aberta`.
 * - `NAO_AUTENTICADO`: fica `anonima`, e a rota protegida leva à entrada.
 * - Qualquer outra falha (5xx, sem rede): fica `indisponivel`. Ninguém é mandado para o login por causa de uma
 *   queda do Postgres ou da rede da escola (Tech Spec, seção 7c; regra 80, item 6).
 */
export async function abrirSessaoPeloCookie(): Promise<void> {
  if (token !== undefined) return
  definirEstado('abrindo')
  try {
    await renovarSessao()
  } catch (erro) {
    ultimoErro = erro
    definirEstado(ehCodigo(erro, CodigoDeErro.NAO_AUTENTICADO) ? 'anonima' : 'indisponivel')
  }
}

/** O que a chamada com sessão aceita além do token, que vem daqui e nunca de quem chamou. */
export type OpcoesComSessao = Omit<OpcoesDaChamada, 'token'>

/**
 * Chamada a uma rota com sessão. Manda o token no `Authorization` e, no `NAO_AUTENTICADO`, renova uma vez e repete
 * a chamada. Só o `NAO_AUTENTICADO` que persiste depois da renovação encerra a sessão.
 */
export async function chamarComSessao<T>(caminho: string, esquema: EsquemaDeResposta<T>, opcoes: OpcoesComSessao = {}): Promise<T> {
  // O token já vencido é renovado antes: a requisição que só serviria para receber 401 não chega a sair.
  if (token !== undefined && expiraEm !== undefined && expiraEm <= Date.now()) await renovarComTokenVencido(token)
  const usado = token
  try {
    return await chamarApi(caminho, esquema, { ...opcoes, token: usado })
  } catch (erro) {
    if (!ehCodigo(erro, CodigoDeErro.NAO_AUTENTICADO)) throw erro
    await renovarComTokenVencido(usado)
    try {
      return await chamarApi(caminho, esquema, { ...opcoes, token })
    } catch (segundoErro) {
      // Recusada com o token recém-emitido: a sessão acabou mesmo (encerrada, inatividade, usuário desativado).
      if (ehCodigo(segundoErro, CodigoDeErro.NAO_AUTENTICADO)) esquecerSessao()
      throw segundoErro
    }
  }
}

/** `GET` numa rota com sessão, com o `AbortSignal` que o TanStack Query cancela. */
export function buscarComSessao<T>(caminho: string, esquema: EsquemaDeResposta<T>, sinal?: AbortSignal): Promise<T> {
  return chamarComSessao(caminho, esquema, { sinal })
}

/**
 * Renova, a menos que outra chamada já tenha trocado o token desde que esta saiu: sem isso, uma rajada de consultas
 * feitas com o token velho rotacionaria o cookie uma vez por consulta.
 */
async function renovarComTokenVencido(usado: string | undefined): Promise<void> {
  if (usado !== undefined && usado !== token) return
  try {
    await renovarSessao()
  } catch (erro) {
    if (ehCodigo(erro, CodigoDeErro.NAO_AUTENTICADO)) esquecerSessao()
    throw erro
  }
}

/**
 * `POST /v1/sessao/email` (RF6). O 503 do semáforo do hash é atraso, não recusa: a web espera o `Retry-After` e
 * tenta sozinha por até 30 s, enquanto o botão mostra "Entrando…" (Tech Spec, seção 5, "Fila"). Qualquer outro erro
 * sobe na hora, para a tela dizer o que fazer.
 *
 * Em `pronta`, o token fica em memória e a sessão passa a `aberta`; nas outras etapas, quem continua é a tela da
 * etapa (19.0 e 20.0), e nenhuma sessão foi gravada.
 */
export async function entrarPorEmail(pedido: PedidoLoginEmail): Promise<RespostaLogin> {
  const limite = Date.now() + PRAZO_DA_ENTRADA_NO_503_MS
  for (;;) {
    try {
      const resposta = await chamarApi(CAMINHO_DA_ENTRADA_POR_EMAIL, esquemaRespostaLogin, { metodo: 'POST', corpo: pedido })
      if (resposta.etapa === 'pronta') guardarToken(resposta)
      return resposta
    } catch (erro) {
      // Só o 503 do semáforo é atraso, e ele vem sempre com `Retry-After`. Sem o cabeçalho é queda de rede ou de
      // instância: aí a pessoa precisa saber na hora, em vez de ver "Entrando…" por trinta segundos.
      const espera = erroDaApi(erro, CodigoDeErro.INDISPONIVEL_TENTE_DE_NOVO)?.esperaSegundos
      if (espera === undefined) throw erro
      const atraso = Math.max(espera * 1_000, ESPERA_MINIMA_NO_503_MS)
      // Esperar mais do que resta do orçamento só atrasaria a mensagem: a resposta não chegaria dentro dos 30 s de
      // "Entrando…" que a tela promete, e a pessoa ficaria olhando o botão sem saber que não entrou.
      if (atraso > limite - Date.now()) throw erro
      await esperar(atraso)
    }
  }
}

/**
 * `DELETE /v1/sessao`, com uma repetição. Não passa por `chamarComSessao` de propósito: encerrar uma sessão que a API
 * já recusou não precisa rotacionar o cookie de renovação só para mandar o pedido outra vez.
 */
async function encerrarNaApi(): Promise<void> {
  // O token de acesso vale 10 min, e a tela pode ter ficado parada mais que isso antes do clique. Sem renovar antes,
  // o `DELETE` levaria um JWT vencido, a guarda responderia 401, e a web contaria como "não há o que encerrar" — com
  // a sessão ainda viva no servidor e o cookie intacto, que devolve tudo à pessoa seguinte do carrinho.
  if (token === undefined || (expiraEm !== undefined && expiraEm <= Date.now())) {
    try {
      await renovarSessao()
    } catch (erro) {
      // Cookie recusado: a sessão acabou mesmo, e não há o que encerrar. Qualquer outra falha é falha da saída.
      if (ehCodigo(erro, CodigoDeErro.NAO_AUTENTICADO)) return
      throw erro
    }
  }
  try {
    await chamarApi(CAMINHO_DA_SESSAO, SEM_CORPO, { metodo: 'DELETE', token })
  } catch (erro) {
    // Recusada com o token em dia: não há mais sessão para encerrar.
    if (ehCodigo(erro, CodigoDeErro.NAO_AUTENTICADO)) return
    // A saída acontece no fim da aula, com a rede da escola oscilando: uma repetição resolve a maioria dos casos.
    await esperar(ESPERA_ENTRE_TENTATIVAS_DE_SAIDA_MS)
    try {
      await chamarApi(CAMINHO_DA_SESSAO, SEM_CORPO, { metodo: 'DELETE', token })
    } catch (segundoErro) {
      // Resposta perdida na primeira tentativa: o pedido chegou, matou a sessão, e só a resposta se perdeu. Avisar
      // "não foi possível encerrar" aí é aviso à toa, e aviso à toa é aviso que ninguém lê.
      if (ehCodigo(segundoErro, CodigoDeErro.NAO_AUTENTICADO)) return
      throw segundoErro
    }
  }
}

/**
 * "Sair" (RF13). Não propaga erro: o que acontece com a falha é a tela de entrada avisar (`saidaPendente`), porque
 * esta aba esquece o token de qualquer jeito — o computador da escola é compartilhado, e o token em memória é o que
 * a pessoa seguinte alcançaria primeiro.
 */
export async function sair(): Promise<void> {
  try {
    await encerrarNaApi()
    saidaConfirmada = true
  } catch {
    // Sem confirmação da API, o cookie de renovação pode continuar valendo: a sessão não acabou de verdade.
    saidaConfirmada = false
  } finally {
    esquecerSessao()
  }
}
