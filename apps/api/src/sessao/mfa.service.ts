import { ErroDeDominio, METRICAS, relogioDoSistema, type Banco, type Meter, type Relogio } from '@educa/nucleo'
import { CodigoDeErro, type EtapaComDesafio, type PedidoMfa, type RespostaAtivarMfa, type RespostaConfigurarMfa } from '@educa/shared'
import type { CifraDoSegredo } from './cifra-do-segredo.js'
import type { ConclusaoDeLogin } from './conclusao-de-login.js'
import type { ContadorDeTentativas } from './contador-de-tentativas.js'
import type { CookieDeDispositivo } from './cookie-dispositivo.js'
import { COOKIE_DISPOSITIVO, lerCookie } from './cookies.js'
import { verificarDesafio, type ConsumoDeDesafio, type DesafioVerificado } from './desafio.js'
import { ipParaRegistro, type OrigemDaRequisicao, type ResultadoDoLogin } from './login.service.js'
import { ResolucaoDeTenantRepository, type MfaDaConta } from './resolucao-de-tenant.repository.js'
import { gerarCodigosDeRecuperacao, gerarSegredo, hmacDaRecuperacao, normalizarRecuperacao, passoDoCodigo } from './segundo-fator.js'

export interface DependenciasDoMfa {
  readonly banco: Banco
  readonly resolucao: ResolucaoDeTenantRepository
  readonly contador: ContadorDeTentativas
  readonly dispositivo: CookieDeDispositivo
  readonly cifra: CifraDoSegredo
  readonly consumo: ConsumoDeDesafio
  readonly conclusao: ConclusaoDeLogin
  /** Chave de assinatura do desafio, a mesma do token de acesso. */
  readonly chaveAssinatura: Uint8Array
  /** Chave do HMAC dos códigos de recuperação (`IDENTIDADE_CHAVE_RECUPERACAO`). */
  readonly chaveRecuperacao: Uint8Array
  readonly medidor: Meter
  readonly relogio?: Relogio
}

const naoAutenticado = () => new ErroDeDominio(CodigoDeErro.NAO_AUTENTICADO)

/**
 * O segundo fator do coordenador (RF12; Tech Spec, seções 4 e 5): configurar e ativar o app autenticador, e entrar
 * com o código dele ou com um código de recuperação. Toda rota recebe o desafio no `Authorization`, nunca o token de
 * acesso, e toda recusa é `NAO_AUTENTICADO`, sem dizer se foi o desafio, a etapa ou o código.
 *
 * - **Configurar e ativar** só com o desafio `configurar_mfa` e o MFA inativo: quem tem só a senha de uma conta com
 *   MFA não troca o segundo fator. A ativação consome o desafio e não abre sessão: a pessoa entra de novo, agora com o
 *   código (o caminho feliz do `mfa.int.test.ts`).
 * - **Entrar** só com o desafio `mfa`. O código do app vale uma vez (`mfa_ultimo_passo`), e o de recuperação também
 *   (`usado_em`), as duas coisas decididas no banco.
 * - **Tentativas:** cada código conta no `ContadorDeTentativas`, com a chave `HMAC(conta_id)`, sem escola (a conta é
 *   global) e separada da chave do e-mail: o acerto da senha zera o contador da senha, não o do segundo fator. É o
 *   limite próprio do MFA: na quinta falha seguida, a resposta é `CONTA_SEGURADA` e o desafio é consumido, e daí nem
 *   o código certo passa com ele; a espera dobra de 30 s a 15 min, como a da senha. O sufixo `conhecido` vale para o
 *   navegador que já concluiu um login desta conta, que só ganha o `educa_dispositivo` depois do segundo fator.
 * - **Redis de fila fora:** o desafio é recusado antes de qualquer código ser conferido, e a pessoa entra de novo.
 * - **Fim:** o acerto consome o desafio e segue como o login da senha, para `escolher` (com o MFA cumprido) ou
 *   `pronta`, que grava a sessão e os cookies `educa_sessao` e `educa_dispositivo`.
 */
export class MfaService {
  readonly #relogio: Relogio
  readonly #contaSegurada: ReturnType<Meter['createCounter']>

  constructor(private readonly dependencias: DependenciasDoMfa) {
    this.#relogio = dependencias.relogio ?? relogioDoSistema
    this.#contaSegurada = dependencias.medidor.createCounter(METRICAS.contaSegurada, { description: 'Tentativas de login respondidas com CONTA_SEGURADA' })
  }

  async configurar(desafio: string): Promise<RespostaConfigurarMfa> {
    const verificado = await this.#desafioLivre(desafio, 'configurar_mfa')
    const conta = await this.dependencias.resolucao.mfaDaConta(verificado.contaId)
    if (conta === undefined) throw naoAutenticado()
    // Com o MFA já ativo, quem recusa é o banco (`where mfa_ativado_em is null`), e não uma leitura anterior: entre as
    // duas, outra aba pode ter ativado.
    const novo = gerarSegredo()
    const { cifrado, versao } = this.dependencias.cifra.cifrar(novo.bytes, conta.id)
    if (!(await this.dependencias.resolucao.gravarSegredoDeMfa(conta.id, cifrado, versao))) throw naoAutenticado()
    return { uri: novo.uri, segredo: novo.base32 }
  }

  async ativar(desafio: string, codigo: string): Promise<RespostaAtivarMfa> {
    const verificado = await this.#desafioLivre(desafio, 'configurar_mfa')
    const conta = await this.dependencias.resolucao.mfaDaConta(verificado.contaId)
    if (conta === undefined || conta.segredoCifrado === null) throw naoAutenticado()
    const passo = passoDoCodigo(this.#segredo(conta), codigo, this.#relogio.agora())
    if (passo === undefined) throw naoAutenticado()
    // Consome antes de gravar: dois pedidos com o mesmo desafio não ativam duas vezes, e o segundo nunca recebe outro
    // lote de códigos. O código errado, acima, não consome. Com dois desafios (duas abas), quem decide é o `update`
    // condicional da ativação, que só passa com o MFA inativo e com o segredo que foi conferido aqui.
    await this.dependencias.consumo.consumir(verificado)
    const codigos = gerarCodigosDeRecuperacao()
    const hmacs = codigos.map((texto) => hmacDaRecuperacao(this.dependencias.chaveRecuperacao, texto))
    const segredoConferido = conta.segredoCifrado
    const ativou = await this.dependencias.banco.transaction((tx) => new ResolucaoDeTenantRepository(tx).ativarMfa(conta.id, segredoConferido, passo, hmacs))
    if (!ativou) throw naoAutenticado()
    return { codigosRecuperacao: codigos }
  }

  async entrar(desafio: string, pedido: PedidoMfa, origem: OrigemDaRequisicao): Promise<ResultadoDoLogin> {
    const { resolucao, contador, dispositivo } = this.dependencias
    const verificado = await this.#desafioLivre(desafio, 'mfa')
    const conta = await resolucao.mfaDaConta(verificado.contaId)
    if (conta === undefined || conta.ativadoEm === null) throw naoAutenticado()

    const conhecido = dispositivo.conhece(lerCookie(origem.cabecalhoCookie, COOKIE_DISPOSITIVO), conta.email)
    const chave = contador.chaveDe(conta.id, conhecido ? 'conhecido' : 'outro')
    const reserva = await contador.reservar(chave)
    if (!reserva.liberada) throw this.#segurada(reserva.esperaMs)

    if (!(await this.#fatorConfere(conta, pedido))) {
      await resolucao.gravarFalhaDeLoginPorEmail(ipParaRegistro(origem.ip))
      if (reserva.esperaSeFalharMs > 0) {
        // O quinto erro seguido gasta o desafio: daí em diante, nem o código certo passa com ele.
        await this.dependencias.consumo.consumir(verificado).catch(() => undefined)
        throw this.#segurada(reserva.esperaSeFalharMs)
      }
      throw naoAutenticado()
    }

    await contador.zerar(chave)
    await this.dependencias.consumo.consumir(verificado)
    const usuarios = (await resolucao.usuariosAtivosDaConta(conta.id)).filter((ativo) => ativo.papel !== 'aluno')
    if (usuarios.length === 0) throw naoAutenticado()
    return this.dependencias.conclusao.concluir({ contaId: conta.id, email: conta.email, usuarios, mfaAtivo: true, mfaCumprido: true }, origem)
  }

  /** O código do app (passo novo, gravado no banco) ou o de recuperação (usado uma vez, no banco). */
  async #fatorConfere(conta: MfaDaConta, pedido: PedidoMfa): Promise<boolean> {
    if ('codigo' in pedido) {
      const passo = passoDoCodigo(this.#segredo(conta), pedido.codigo, this.#relogio.agora())
      return passo !== undefined && (await this.dependencias.resolucao.avancarPassoDoMfa(conta.id, passo))
    }
    const codigo = normalizarRecuperacao(pedido.recuperacao)
    return codigo !== undefined && (await this.dependencias.resolucao.usarCodigoDeRecuperacao(conta.id, hmacDaRecuperacao(this.dependencias.chaveRecuperacao, codigo)))
  }

  #segredo(conta: MfaDaConta): Uint8Array {
    if (conta.segredoCifrado === null || conta.chaveVersao === null) throw naoAutenticado()
    return this.dependencias.cifra.decifrar({ cifrado: conta.segredoCifrado, versao: conta.chaveVersao }, conta.id)
  }

  /** O desafio da etapa, com assinatura, prazo, `typ` e `aud` conferidos, e ainda não usado. */
  async #desafioLivre(desafio: string, etapa: EtapaComDesafio): Promise<DesafioVerificado> {
    const verificado = await verificarDesafio(desafio, this.dependencias.chaveAssinatura, [etapa])
    await this.dependencias.consumo.conferirLivre(verificado)
    return verificado
  }

  #segurada(esperaMs: number): ErroDeDominio {
    this.#contaSegurada.add(1)
    return new ErroDeDominio(CodigoDeErro.CONTA_SEGURADA, undefined, Math.max(1, Math.ceil(esperaMs / 1_000)))
  }
}
