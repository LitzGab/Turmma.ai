import {
  contextoAtual,
  DURACAO_DA_SESSAO_HORAS,
  ErroDeDominio,
  executarNoContexto,
  IP_DESCONHECIDO,
  METRICAS,
  type Ambiente,
  type Banco,
  type EmissorDeToken,
  type Meter,
} from '@educa/nucleo'
import { CodigoDeErro, type EtapaComDesafio, type PedidoLoginEmail, type RespostaLogin } from '@educa/shared'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import type { ContadorDeTentativas } from './contador-de-tentativas.js'
import { MAX_AGE_DO_COOKIE_DISPOSITIVO_SEGUNDOS, type CookieDeDispositivo } from './cookie-dispositivo.js'
import { COOKIE_DISPOSITIVO, COOKIE_SESSAO, lerCookie, serializarCookie } from './cookies.js'
import { CriacaoDeSessaoRepository } from './criacao-de-sessao.repository.js'
import type { EmissorDeDesafio } from './desafio.js'
import type { HashDeSenha } from './hash-de-senha.js'
import { RegistroDeAcessoRepository } from './registro-de-acesso.repository.js'
import type { ResolucaoDeTenantRepository, UsuarioAtivoDaConta } from './resolucao-de-tenant.repository.js'

/** O que o controller tira da requisição HTTP: o IP (o da borda, quando vem dela) e o cabeçalho `Cookie`. */
export interface OrigemDaRequisicao {
  readonly ip: string
  readonly cabecalhoCookie: string | undefined
}

/** A resposta do login e os `Set-Cookie` que vão com ela. */
export interface ResultadoDoLogin {
  readonly resposta: RespostaLogin
  readonly cookies: readonly string[]
}

export interface DependenciasDoLogin {
  readonly banco: Banco
  readonly resolucao: ResolucaoDeTenantRepository
  readonly hash: HashDeSenha
  readonly contador: ContadorDeTentativas
  readonly dispositivo: CookieDeDispositivo
  readonly emissorDeToken: EmissorDeToken
  readonly emissorDeDesafio: EmissorDeDesafio
  readonly ambiente: Ambiente
  readonly medidor: Meter
}

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
 */
export class LoginService {
  readonly #contaSegurada: ReturnType<Meter['createCounter']>

  constructor(private readonly dependencias: DependenciasDoLogin) {
    this.#contaSegurada = dependencias.medidor.createCounter(METRICAS.contaSegurada, { description: 'Tentativas de login respondidas com CONTA_SEGURADA' })
  }

  async entrarPorEmail(pedido: PedidoLoginEmail, origem: OrigemDaRequisicao): Promise<ResultadoDoLogin> {
    const { resolucao, hash, contador, dispositivo } = this.dependencias
    const email = normalizarEmail(pedido.email)
    const cookieDispositivo = lerCookie(origem.cabecalhoCookie, COOKIE_DISPOSITIVO)
    const chave = contador.chaveDe(email, dispositivo.conhece(cookieDispositivo, email) ? 'conhecido' : 'outro')

    const reserva = await contador.reservar(chave)
    if (!reserva.liberada) throw this.#segurada(reserva.esperaMs)

    const credencial = await resolucao.contaPorEmail(email)
    const confere = await hash.verificar(credencial?.senhaHash, pedido.senha)
    // Só com a senha certa há uma consulta a mais (os usuários ativos): o tempo dela só diz algo a quem já tem a
    // senha. Não copie este padrão para antes do hash.
    const usuarios = confere && credencial !== undefined ? (await resolucao.usuariosAtivosDaConta(credencial.id)).filter((ativo) => ativo.papel !== 'aluno') : []
    if (credencial === undefined || usuarios.length === 0) {
      await resolucao.gravarFalhaDeLoginPorEmail(ipParaRegistro(origem.ip))
      if (reserva.esperaSeFalharMs > 0) throw this.#segurada(reserva.esperaSeFalharMs)
      throw new ErroDeDominio(CodigoDeErro.NAO_AUTENTICADO)
    }

    await contador.zerar(chave)
    const etapa = etapaDoLogin(usuarios, credencial.mfaAtivo)
    if (etapa !== 'pronta') {
      // Sem cookie nenhum: o login ainda não terminou. Quem tem só a senha de um coordenador não ganha o
      // `educa_dispositivo` sem o segundo fator; as rotas que concluem a etapa (6.0 e 12.0) o gravam.
      const desafio = await this.dependencias.emissorDeDesafio.emitir({ contaId: credencial.id, etapa, mfaCumprido: false })
      return { resposta: { etapa, desafio }, cookies: [] }
    }
    const [unico] = usuarios
    if (unico === undefined) throw new Error('etapa pronta sem usuário')
    const { token, expiraEm, refresh } = await this.#criarSessao(unico, credencial.id, origem.ip)
    return {
      resposta: { etapa: 'pronta', token, expiraEm: expiraEm.toISOString() },
      cookies: [
        serializarCookie(COOKIE_DISPOSITIVO, dispositivo.comEntrada(cookieDispositivo, email), {
          ambiente: this.dependencias.ambiente,
          maxAgeSegundos: MAX_AGE_DO_COOKIE_DISPOSITIVO_SEGUNDOS,
        }),
        serializarCookie(COOKIE_SESSAO, refresh, { ambiente: this.dependencias.ambiente }),
      ],
    }
  }

  /**
   * Grava a sessão e o registro de acesso na escola do usuário, numa transação, num contexto que tem só a escola:
   * a criação lê a escola do contexto, e a FK composta recusa usuário de outra escola.
   */
  async #criarSessao(usuario: UsuarioAtivoDaConta, contaId: string, ip: string): Promise<{ token: string; expiraEm: Date; refresh: string }> {
    const refresh = randomBytes(BYTES_DO_REFRESH).toString('base64url')
    const requisicaoId = contextoAtual()?.requisicaoId ?? randomUUID()
    const sessaoId = await executarNoContexto({ requisicaoId, escolaId: usuario.escolaId }, () =>
      this.dependencias.banco.transaction(async (tx) => {
        const [criada] = await new CriacaoDeSessaoRepository(tx).criarSessoes([
          { usuarioId: usuario.usuarioId, contaId, metodo: 'email', refreshHash: hashDoRefresh(refresh), duracaoHoras: DURACAO_DA_SESSAO_HORAS },
        ])
        if (criada === undefined) throw new Error('sessão não criada')
        await new RegistroDeAcessoRepository(tx).gravar('login', usuario.usuarioId, ipParaRegistro(ip))
        return criada.id
      }),
    )
    const { token, expiraEm } = await this.dependencias.emissorDeToken.emitir({ escolaId: usuario.escolaId, usuarioId: usuario.usuarioId, sessaoId })
    return { token, expiraEm, refresh }
  }

  #segurada(esperaMs: number): ErroDeDominio {
    this.#contaSegurada.add(1)
    return new ErroDeDominio(CodigoDeErro.CONTA_SEGURADA, undefined, Math.max(1, Math.ceil(esperaMs / 1_000)))
  }
}

/**
 * A etapa depois da senha certa (Tech Spec, seção 5, "Etapas"): mais de um usuário ativo, `escolher`; um só
 * coordenador, o segundo fator (`mfa`, ou `configurar_mfa` quando ainda não tem); um só professor, `pronta`.
 */
export function etapaDoLogin(usuarios: readonly Pick<UsuarioAtivoDaConta, 'papel'>[], mfaAtivo: boolean): EtapaComDesafio | 'pronta' {
  if (usuarios.length > 1) return 'escolher'
  if (usuarios[0]?.papel === 'coordenador') return mfaAtivo ? 'mfa' : 'configurar_mfa'
  return 'pronta'
}

/** O IP como o registro de acesso o grava: o que não foi lido vira o não roteável. */
export function ipParaRegistro(ip: string): string {
  return ip === IP_DESCONHECIDO ? IP_NAO_LIDO : ip
}
