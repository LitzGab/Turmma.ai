import { contextoAtual, DURACAO_DA_SESSAO_HORAS, executarNoContexto, type Ambiente, type Banco, type EmissorDeToken } from '@educa/nucleo'
import type { RespostaLogin } from '@educa/shared'
import { randomBytes, randomUUID } from 'node:crypto'
import { MAX_AGE_DO_COOKIE_DISPOSITIVO_SEGUNDOS, type CookieDeDispositivo } from './cookie-dispositivo.js'
import { COOKIE_DISPOSITIVO, COOKIE_SESSAO, lerCookie, serializarCookie } from './cookies.js'
import { CriacaoDeSessaoRepository } from './criacao-de-sessao.repository.js'
import type { EmissorDeDesafio } from './desafio.js'
import { BYTES_DO_REFRESH, etapaDoLogin, hashDoRefresh, ipParaRegistro, type OrigemDaRequisicao, type ResultadoDoLogin } from './login.service.js'
import { RegistroDeAcessoRepository } from './registro-de-acesso.repository.js'
import type { UsuarioAtivoDaConta } from './resolucao-de-tenant.repository.js'

export interface DependenciasDaConclusao {
  readonly banco: Banco
  readonly dispositivo: CookieDeDispositivo
  readonly emissorDeToken: EmissorDeToken
  readonly emissorDeDesafio: EmissorDeDesafio
  readonly ambiente: Ambiente
}

/** O que a etapa que acabou de passar sabe da pessoa: a conta, o e-mail dela (só para o HMAC do cookie) e os usuários ativos. */
export interface CredencialConferida {
  readonly contaId: string
  readonly email: string
  readonly usuarios: readonly UsuarioAtivoDaConta[]
  readonly mfaAtivo: boolean
  /** Se o segundo fator já foi cumprido nesta entrada. */
  readonly mfaCumprido: boolean
}

/**
 * O fim de cada etapa do login da equipe (Tech Spec, seção 5, "Etapas"), usado pela senha (4.0) e pelo segundo fator
 * (6.0): decide a próxima etapa e, só em `pronta`, grava a sessão, o registro de acesso e os dois cookies.
 *
 * - **Sem cookie antes do fim:** nas etapas com desafio não sai `educa_sessao` nem `educa_dispositivo`. Quem tem só a
 *   senha de um coordenador não ganha a marca de navegador conhecido sem o segundo fator.
 * - **`educa_dispositivo` em `pronta`:** a entrada da conta no topo, com a data de agora.
 */
export class ConclusaoDeLogin {
  constructor(private readonly dependencias: DependenciasDaConclusao) {}

  async concluir(credencial: CredencialConferida, origem: OrigemDaRequisicao): Promise<ResultadoDoLogin> {
    const etapa = etapaDoLogin(credencial.usuarios, credencial.mfaAtivo, credencial.mfaCumprido)
    if (etapa !== 'pronta') {
      const desafio = await this.dependencias.emissorDeDesafio.emitir({ contaId: credencial.contaId, etapa, mfaCumprido: credencial.mfaCumprido })
      return { resposta: { etapa, desafio }, cookies: [] }
    }
    const [unico] = credencial.usuarios
    if (unico === undefined) throw new Error('etapa pronta sem usuário')
    const { token, expiraEm, refresh } = await this.#criarSessao(unico, credencial.contaId, origem.ip)
    const resposta: RespostaLogin = { etapa: 'pronta', token, expiraEm: expiraEm.toISOString() }
    return {
      resposta,
      cookies: [
        serializarCookie(COOKIE_DISPOSITIVO, this.dependencias.dispositivo.comEntrada(lerCookie(origem.cabecalhoCookie, COOKIE_DISPOSITIVO), credencial.email), {
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
}
