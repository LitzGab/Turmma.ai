import { IP_DESCONHECIDO, type Meter } from '@educa/nucleo'
import type { EtapaComDesafio, PedidoLoginEmail, RespostaLogin } from '@educa/shared'
import { createHash } from 'node:crypto'
import type { ConclusaoDeLogin } from './conclusao-de-login.js'
import type { AtivacaoPorConvite } from './convite.service.js'
import type { ContadorDeTentativas } from './contador-de-tentativas.js'
import type { CookieDeDispositivo } from './cookie-dispositivo.js'
import { COOKIE_DISPOSITIVO, lerCookie } from './cookies.js'
import type { ResolucaoDeTenantRepository, UsuarioAtivoDaConta } from './resolucao-de-tenant.repository.js'
import { baldeDaEquipe, contadorDoRebaixamentoPorIp } from './senha/baldes-de-login.js'
import type { ConferenciaNaVez, TentativaDeSenha } from './senha/conferencia-na-vez.js'
import { DuracaoDoLogin } from './senha/duracao-do-login.js'
import type { LimiteDoEmailPorIp } from './senha/limite-email-ip.js'

/** O que o controller tira da requisição HTTP: o IP (o da borda, quando vem dela) e o cabeçalho `Cookie`. */
export interface OrigemDaRequisicao {
  readonly ip: string
  readonly cabecalhoCookie: string | undefined
  /**
   * Só nas rotas de login por senha (`@LimiteQueRebaixa()`, 15.0): o IP passou do limite por IP delas. A tentativa não é
   * recusada: vai para o fim do balde, salvo quem traz o `educa_dispositivo` da conta.
   */
  readonly acimaDoLimiteDoIp?: boolean
}

/** A resposta do login e os `Set-Cookie` que vão com ela. */
export interface ResultadoDoLogin {
  readonly resposta: RespostaLogin
  readonly cookies: readonly string[]
}

export interface DependenciasDoLogin {
  readonly resolucao: ResolucaoDeTenantRepository
  /** A vez no semáforo do hash, o contador e o hash (14.0, 15.6): a vez é pedida antes de contar a tentativa. */
  readonly conferencia: ConferenciaNaVez
  readonly contador: ContadorDeTentativas
  /** O limite por IP da rota (15.2): acima dele, a tentativa vai para o fim do balde da equipe. */
  readonly limitePorIp: LimiteDoEmailPorIp
  readonly dispositivo: CookieDeDispositivo
  readonly conclusao: ConclusaoDeLogin
  readonly ativacao: AtivacaoPorConvite
  readonly medidor: Meter
}

/** A credencial da conta como a resolução a devolve, pelo e-mail. */
type CredencialDaConta = Awaited<ReturnType<ResolucaoDeTenantRepository['contaPorEmail']>>

/** O registro de acesso guarda o IP como `inet`: o endereço que não foi lido (socket já fechado) vira o não roteável. */
const IP_NAO_LIDO = '0.0.0.0'

/** Bytes do refresh: 256 bits sorteados. O banco guarda só o SHA-256, e o cookie leva o valor. */
export const BYTES_DO_REFRESH = 32

/** O e-mail como a conta o guarda (`citext`): sem espaço nas pontas e sem diferença de caixa. */
export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase()
}

/** O SHA-256 do refresh do cookie `educa_sessao`: é o que `sessao.refresh_hash` guarda e a renovação (5.0) procura. */
export function hashDoRefresh(refresh: string): string {
  return createHash('sha256').update(refresh).digest('hex')
}

/**
 * O login da equipe por e-mail e senha (RF6, RF11, RF14; Tech Spec, seção 5).
 *
 * - **Respostas iguais:** senha errada, e-mail que não existe e conta sem usuário ativo levam um hash cada e a mesma
 *   resposta, `NAO_AUTENTICADO`, e as três contam no contador daquele e-mail: nem o tempo, nem o corpo, nem o
 *   bloqueio dizem se a conta existe.
 * - **Segura por conta, nunca por IP:** a tentativa é contada antes do hash, no contador do e-mail e da origem
 *   (`conhecido` quando o navegador tem o `educa_dispositivo` daquela conta). Segurada, responde 429
 *   `CONTA_SEGURADA` com `Retry-After`, sem conferir a senha.
 * - **Etapas:** mais de um usuário ativo leva a `escolher`; um coordenador leva a `configurar_mfa` ou `mfa`; um
 *   professor, a `pronta`. Só `pronta` grava sessão e os cookies `educa_sessao` e `educa_dispositivo`; as outras
 *   devolvem só o desafio, sem cookie.
 * - **Convite aceito por conta que já tinha senha** (7.0): só com o `bilhete` que o aceite devolveu, da mesma conta, o
 *   usuário que espera o convite conta como usuário da conta, e só é ativado com a credencial inteira. Sem MFA, logo
 *   depois da senha certa; com MFA, a resposta é `mfa` com o convite no desafio, e quem ativa é o `MfaService`, depois
 *   do código. Sem o bilhete, o login segue como se não houvesse convite.
 * - **Semáforo do hash** (14.0): todo login por e-mail, exista a conta ou não, espera a vez no balde `equipe`, com a
 *   vez rodando por IP. A vez vem antes de a tentativa ser contada: o 503 de quem esperou demais não conta como senha
 *   errada, e a web que repete o pedido no 503 não segura a conta de ninguém.
 * - **Limite por IP** (15.2): o IP acima de `LIMITE_LOGIN_EMAIL_IP_MIN` tentativas por minuto (vezes as escolas da rede,
 *   se é o IP de saída dela) vai para o fim do balde da equipe, nunca recusado; quem traz a conta no
 *   `educa_dispositivo` mantém a vez.
 */
export class LoginService {
  readonly #duracao: DuracaoDoLogin
  readonly #rebaixadasPeloIp: { contar: () => void }

  constructor(private readonly dependencias: DependenciasDoLogin) {
    this.#duracao = new DuracaoDoLogin(dependencias.medidor, 'email')
    this.#rebaixadasPeloIp = contadorDoRebaixamentoPorIp(dependencias.medidor)
  }

  entrarPorEmail(pedido: PedidoLoginEmail, origem: OrigemDaRequisicao): Promise<ResultadoDoLogin> {
    return this.#duracao.medir(() => this.#entrarPorEmail(pedido, origem))
  }

  async #entrarPorEmail(pedido: PedidoLoginEmail, origem: OrigemDaRequisicao): Promise<ResultadoDoLogin> {
    const { resolucao, conferencia, contador, dispositivo, limitePorIp } = this.dependencias
    const email = normalizarEmail(pedido.email)
    const conhecido = dispositivo.conhece(lerCookie(origem.cabecalhoCookie, COOKIE_DISPOSITIVO), email)
    const chave = contador.chaveDe(email, conhecido ? 'conhecido' : 'outro')
    // As duas contagens andam sempre: a do limite da rota de e-mail e, na guarda, a do limite por IP do login.
    const acimaDoLimiteDaRota = await limitePorIp.rebaixar(origem.ip, conhecido)
    const peloIp = !conhecido && origem.acimaDoLimiteDoIp === true
    if (peloIp) this.#rebaixadasPeloIp.contar()
    const rebaixado = acimaDoLimiteDaRota || peloIp
    const tentativa: TentativaDeSenha<CredencialDaConta> = {
      balde: baldeDaEquipe(origem.ip, rebaixado),
      chave,
      senha: pedido.senha,
      lerCredencial: () => resolucao.contaPorEmail(email),
    }

    const { reserva, credencial, confere } = await conferencia.conferir(tentativa)
    // Só com a senha certa há uma consulta a mais (os usuários ativos): o tempo dela só diz algo a quem já tem a
    // senha. Não copie este padrão para antes do hash.
    const { ativacao } = this.dependencias
    const pendente = confere && credencial !== undefined ? await ativacao.pendentePeloBilhete(pedido.bilhete, credencial.id) : undefined
    // Sem MFA, o usuário do convite é ativado já com a senha certa; com MFA, só depois do código (`MfaService`).
    if (pendente !== undefined && credencial?.mfaAtivo === false) await ativacao.ativar(pendente)
    const esperaCodigo = pendente !== undefined && credencial?.mfaAtivo === true
    const usuarios = confere && credencial !== undefined ? await this.#usuariosAtivos(credencial.id) : []
    if (credencial === undefined || (usuarios.length === 0 && !esperaCodigo)) {
      await resolucao.gravarFalhaDeLoginPorEmail(ipParaRegistro(origem.ip))
      return conferencia.recusar(tentativa, reserva)
    }

    await contador.zerar(chave)
    if (esperaCodigo) return this.dependencias.conclusao.pedirSegundoFator(credencial.id, pendente.conviteId)
    return this.dependencias.conclusao.concluir({ contaId: credencial.id, email, usuarios, mfaAtivo: credencial.mfaAtivo, mfaCumprido: false }, origem)
  }

  async #usuariosAtivos(contaId: string): Promise<UsuarioAtivoDaConta[]> {
    return (await this.dependencias.resolucao.usuariosAtivosDaConta(contaId)).filter((ativo) => ativo.papel !== 'aluno')
  }
}

/**
 * A etapa depois da credencial certa (Tech Spec, seção 5, "Etapas"): mais de um usuário ativo, `escolher`; um só
 * coordenador, o segundo fator (`mfa`, ou `configurar_mfa` quando ainda não tem), a menos que ele já tenha sido
 * cumprido nesta entrada; um só professor, `pronta`.
 */
export function etapaDoLogin(usuarios: readonly Pick<UsuarioAtivoDaConta, 'papel'>[], mfaAtivo: boolean, mfaCumprido = false): EtapaComDesafio | 'pronta' {
  if (usuarios.length > 1) return 'escolher'
  if (usuarios[0]?.papel === 'coordenador' && !mfaCumprido) return mfaAtivo ? 'mfa' : 'configurar_mfa'
  return 'pronta'
}

/** O IP como o registro de acesso o grava: o que não foi lido vira o não roteável. */
export function ipParaRegistro(ip: string): string {
  return ip === IP_DESCONHECIDO ? IP_NAO_LIDO : ip
}
