import { contextoAtual, ErroDeDominio, executarNoContexto, RegistroDeAuditoria, relogioDoSistema, VALIDADE_DO_CONVITE_HORAS, type Banco, type Relogio } from '@educa/nucleo'
import { CodigoDeErro, type PedidoAceitarConvite, type RespostaAceitarConvite, type RespostaConsultarConvite } from '@educa/shared'
import { createHash, randomBytes, randomUUID } from 'node:crypto'
import type { ConferenciaDoAutor } from '../operacao/operador.repository.js'
import type { BilheteDeConvite } from './bilhete-de-convite.js'
import { ConviteRepository } from './convite.repository.js'
import type { EmissorDeDesafio } from './desafio.js'
import type { HashDeSenha } from './hash-de-senha.js'
import { normalizarEmail } from './login.service.js'
import { ResolucaoDeTenantRepository, type UsuarioComConviteAceito } from './resolucao-de-tenant.repository.js'

/** Bytes do token do convite: 256 bits sorteados. O banco guarda só o SHA-256, e o link leva o valor. */
export const BYTES_DO_TOKEN_DE_CONVITE = 32

const registro = new RegistroDeAuditoria()

/** Expirado, revogado, usado e inexistente: a mesma resposta, que não diz se o convite existe (regra 10, item 6). */
const conviteInvalido = () => new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)

/** O SHA-256 do token, em hex: é o que `convite.token_hash` guarda e o aceite procura. */
export function hashDoToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export interface DependenciasDoConvite {
  readonly banco: Banco
  readonly resolucao: ResolucaoDeTenantRepository
  readonly hash: HashDeSenha
  readonly emissorDeDesafio: EmissorDeDesafio
  readonly bilhetes: BilheteDeConvite
}

/**
 * As rotas anônimas do convite do primeiro coordenador (RF1, RF12; Tech Spec, seção 5, "Convite"), com o token sempre
 * no corpo.
 *
 * - **Consultar:** só o nome da escola que convida.
 * - **Aceitar, conta sem senha:** exige a senha, grava o hash, ativa o usuário, grava `convite.aceito` e responde
 *   `configurar_mfa` com o desafio, sem sessão e sem cookie: o aceite não pula o MFA.
 * - **Aceitar, conta com senha** (a pessoa trabalha em outra escola cliente): a senha que vier é ignorada, o convite é
 *   marcado como usado e a resposta é `entrar`, com o bilhete do convite (30 min). O usuário desta escola só é ativado
 *   quando a pessoa entra com a senha e o segundo fator que a conta já tem **e** com esse bilhete
 *   (`AtivacaoPorConvite`): o login rotineiro da conta, sem o link, nunca ativa. O link nunca troca a senha de uma
 *   conta existente.
 * - **Uso único no banco:** o aceite é o `update … where usado_em is null and revogado_em is null and expira_em > now()`,
 *   e a senha só é gravada `where senha_hash is null`, na mesma transação.
 */
export class ConviteService {
  constructor(private readonly dependencias: DependenciasDoConvite) {}

  async consultar(token: string): Promise<RespostaConsultarConvite> {
    const valido = await this.dependencias.resolucao.conviteValidoPorHash(hashDoToken(token))
    if (valido === undefined) throw conviteInvalido()
    const requisicaoId = contextoAtual()?.requisicaoId ?? randomUUID()
    const escolaNome = await executarNoContexto({ requisicaoId, escolaId: valido.escolaId }, () => new ConviteRepository(this.dependencias.banco).nomeDaEscola())
    if (escolaNome === undefined) throw conviteInvalido()
    return { escolaNome }
  }

  async aceitar(pedido: PedidoAceitarConvite): Promise<RespostaAceitarConvite> {
    const { banco, resolucao, hash, emissorDeDesafio, bilhetes } = this.dependencias
    const tokenHash = hashDoToken(pedido.token)
    const valido = await resolucao.conviteValidoPorHash(tokenHash)
    if (valido === undefined) throw conviteInvalido()
    if (!valido.contaTemSenha && pedido.senha === undefined) throw new ErroDeDominio(CodigoDeErro.ENTRADA_INVALIDA)
    // O hash sai antes da transação, para ela não segurar a linha do convite durante o argon2.
    const senhaHash = !valido.contaTemSenha && pedido.senha !== undefined ? await hash.gerar(pedido.senha) : undefined
    const requisicaoId = contextoAtual()?.requisicaoId ?? randomUUID()

    const aceite = await banco.transaction(async (tx) => {
      const resolucaoNaTransacao = new ResolucaoDeTenantRepository(tx)
      const usado = await resolucaoNaTransacao.usarConvitePorHash(tokenHash)
      if (usado === undefined) return undefined
      // Se outro convite da mesma conta definiu a senha entre a leitura e aqui, esta não é gravada: vale o caminho da
      // conta que já tem senha.
      const senhaDefinida = senhaHash !== undefined && (await resolucaoNaTransacao.definirSenhaNoAceite(valido.contaId, senhaHash))
      await executarNoContexto({ requisicaoId, escolaId: usado.escolaId, usuarioId: usado.usuarioId }, async () => {
        if (senhaDefinida && !(await new ConviteRepository(tx).ativarPorConvite(usado.usuarioId, usado.id))) throw new Error('usuário do convite não ativado')
        await registro.gravar(tx, 'convite.aceito', { entidadeId: usado.id, depois: { usuarioId: usado.usuarioId, usuarioAtivo: senhaDefinida } })
      })
      return { senhaDefinida, conviteId: usado.id }
    })
    if (aceite === undefined) throw conviteInvalido()
    if (!aceite.senhaDefinida) return { etapa: 'entrar', bilhete: await bilhetes.emitir({ contaId: valido.contaId, conviteId: aceite.conviteId }) }
    return { etapa: 'configurar_mfa', desafio: await emissorDeDesafio.emitir({ contaId: valido.contaId, etapa: 'configurar_mfa', mfaCumprido: false }) }
  }
}

/**
 * A ativação, no login por e-mail, do usuário que espera o convite aceito pela conta que já tinha senha (Tech Spec,
 * seção 5, "Etapas"). Precisa das duas coisas juntas:
 * - o bilhete que o aceite devolveu, conferido e da mesma conta que acabou de provar a senha: quem aceitou o link é
 *   quem entrou. Sem ele, ou com o bilhete de outra conta, nada é ativado;
 * - a credencial inteira: a senha, e o segundo fator quando a conta tem MFA (o `LoginService` leva essa conta a `mfa`
 *   com o convite no desafio, e quem ativa é o `MfaService`, depois do código).
 *
 * O usuário é ativado na escola dele, numa transação com `usuario.ativado_por_convite`, e dois logins ao mesmo tempo
 * ativam uma vez.
 */
export class AtivacaoPorConvite {
  constructor(
    private readonly banco: Banco,
    private readonly bilhetes: BilheteDeConvite,
  ) {}

  /** O usuário que espera o convite do bilhete, se o bilhete vale e é desta conta. Sem aluno. */
  async pendentePeloBilhete(bilhete: string | undefined, contaId: string): Promise<UsuarioComConviteAceito | undefined> {
    if (bilhete === undefined) return undefined
    const verificado = await this.bilhetes.verificar(bilhete)
    if (verificado?.contaId !== contaId) return undefined
    return this.pendenteDoConvite(contaId, verificado.conviteId)
  }

  /** O usuário da conta que espera este convite, pelo id que veio no desafio `mfa` assinado por nós. Sem aluno. */
  async pendenteDoConvite(contaId: string, conviteId: string): Promise<UsuarioComConviteAceito | undefined> {
    const pendente = await new ResolucaoDeTenantRepository(this.banco).usuarioComConviteAceito(contaId, conviteId)
    return pendente?.papel === 'aluno' ? undefined : pendente
  }

  async ativar(pendente: UsuarioComConviteAceito): Promise<void> {
    const requisicaoId = contextoAtual()?.requisicaoId ?? randomUUID()
    await executarNoContexto({ requisicaoId, escolaId: pendente.escolaId, usuarioId: pendente.usuarioId }, () =>
      this.banco.transaction(async (tx) => {
        if (!(await new ConviteRepository(tx).ativarPorConvite(pendente.usuarioId, pendente.conviteId))) return
        await registro.gravar(tx, 'usuario.ativado_por_convite', { entidadeId: pendente.usuarioId, depois: { conviteId: pendente.conviteId } })
      }),
    )
  }
}

/** O pedido do operador, já conferido: o endereço da escola, o e-mail e o nome do coordenador convidado. */
export interface PedidoDeConvite {
  readonly slug: string
  readonly email: string
  readonly nome: string
}

/**
 * O convite do primeiro coordenador, pelo operador (`ops:convite-coordenador`; RF1, RF19). Numa transação, no contexto
 * da escola do slug:
 * - acha ou cria a conta pelo e-mail (conta nova nasce sem senha);
 * - cria o coordenador com essa conta, inativo até o aceite; se ele já existe inativo, volta a esperar o convite novo, e
 *   os convites anteriores dele são revogados; se já existe ativo, `CONFLITO`;
 * - grava o convite com o SHA-256 do token, válido por 72 h, e `convite.criado` com o operador e se a conta é nova
 *   (sem o e-mail: é o que reconstitui um e-mail digitado errado).
 *
 * O autor é conferido como primeira instrução da transação (`ConferenciaDoAutor`), antes de ler a escola do slug.
 * Escola inexistente: `NAO_ENCONTRADO`, antes de criar qualquer coisa. Devolve o id do convite e o token, que o comando
 * grava num arquivo 0600: nunca o token no terminal, nem nome ou e-mail.
 */
export async function criarConviteDeCoordenador(banco: Banco, autor: ConferenciaDoAutor, pedido: PedidoDeConvite, relogio: Relogio = relogioDoSistema): Promise<{ conviteId: string; token: string }> {
  const requisicaoId = contextoAtual()?.requisicaoId ?? randomUUID()
  const token = randomBytes(BYTES_DO_TOKEN_DE_CONVITE).toString('base64url')
  const expiraEm = new Date(relogio.agora().getTime() + VALIDADE_DO_CONVITE_HORAS * 60 * 60 * 1_000)
  const conviteId = await executarNoContexto({ requisicaoId }, () =>
    banco.transaction(async (tx) => {
      // O autor primeiro: quem não passa não lê nem grava nada, nem a escola do slug.
      const autorOperador = await autor(tx)
      const escolaId = await new ResolucaoDeTenantRepository(tx).escolaPorSlug(pedido.slug)
      if (escolaId === undefined) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
      return executarNoContexto({ requisicaoId, escolaId }, async () => {
        const conta = await new ResolucaoDeTenantRepository(tx).contaParaConvite(normalizarEmail(pedido.email))
        const convites = new ConviteRepository(tx)
        const usuarioId = await convites.usuarioConvidado(conta.id, pedido.nome)
        if (usuarioId === undefined) throw new ErroDeDominio(CodigoDeErro.CONFLITO)
        await convites.revogarConvitesDoUsuario(usuarioId)
        const criado = await convites.criarConvite({ tokenHash: hashDoToken(token), usuarioId, expiraEm })
        await registro.gravar(tx, 'convite.criado', { entidadeId: criado, depois: { usuarioId, expiraEm: expiraEm.toISOString(), contaNova: conta.nova }, autorOperador })
        return criado
      })
    }),
  )
  return { conviteId, token }
}

/**
 * A revogação do convite pelo operador (`ops:revogar-convite`; RF19): a escola vem do convite, nunca do argumento, e a
 * revogação e `convite.revogado` são uma transação no contexto dela, com o autor conferido como primeira instrução.
 * Convite inexistente ou já revogado: `NAO_ENCONTRADO`, sem nada gravado. Revogar um convite já aceito por conta que
 * tinha senha impede a ativação no login.
 */
export async function revogarConvitePeloOperador(banco: Banco, autor: ConferenciaDoAutor, conviteId: string): Promise<void> {
  const requisicaoId = contextoAtual()?.requisicaoId ?? randomUUID()
  await executarNoContexto({ requisicaoId }, () =>
    banco.transaction(async (tx) => {
      const autorOperador = await autor(tx)
      const escolaId = await new ResolucaoDeTenantRepository(tx).escolaDoConviteParaOperador(conviteId)
      if (escolaId === undefined) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
      await executarNoContexto({ requisicaoId, escolaId }, async () => {
        if (!(await new ConviteRepository(tx).revogar(conviteId))) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
        await registro.gravar(tx, 'convite.revogado', { entidadeId: conviteId, autorOperador })
      })
    }),
  )
}
