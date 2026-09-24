import { contextoAtual, ErroDeDominio, estadoDaCoordenacao, executarNoContexto, RegistroDeAuditoria, relogioDoSistema, VALIDADE_DO_CONVITE_HORAS, type Banco, type Relogio } from '@educa/nucleo'
import { CodigoDeErro, type EstadoDaCoordenacao, type PedidoAceitarConvite, type RespostaAceitarConvite, type RespostaConsultarConvite } from '@educa/shared'
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

/**
 * O pedido do operador, já conferido: a escola (pelo endereço, no `ops:convite-coordenador`; pelo id do caminho, no
 * painel), o e-mail e o nome da coordenadora convidada.
 */
export type PedidoDeConvite = { readonly email: string; readonly nome: string } & ({ readonly slug: string } | { readonly escolaId: string })

/** O que gerar faz em cada estado da coordenação (Tech Spec da A0b, seção 5, a matriz). */
const GERAR: Readonly<Record<EstadoDaCoordenacao, 'criar' | 'revogar_o_ultimo_e_criar' | 'conflito'>> = {
  sem_convite: 'criar',
  revogado: 'criar',
  sem_coordenacao: 'revogar_o_ultimo_e_criar',
  aceito: 'revogar_o_ultimo_e_criar',
  pendente: 'conflito',
  vencido: 'conflito',
  ativa: 'conflito',
}

/** O que revogar faz em cada estado da coordenação (a mesma matriz). `revogado` fica `NAO_ENCONTRADO`, como no F1. */
const REVOGAR: Readonly<Record<EstadoDaCoordenacao, 'revogar' | 'conflito' | 'nao_encontrado'>> = {
  pendente: 'revogar',
  vencido: 'revogar',
  aceito: 'revogar',
  revogado: 'nao_encontrado',
  sem_convite: 'conflito',
  sem_coordenacao: 'conflito',
  ativa: 'conflito',
}

/**
 * Pega a trava do convite da escola do contexto e só então lê o estado da coordenação (seção 7c, "Convite da escola").
 * Escola inexistente: `NAO_ENCONTRADO`, antes de qualquer escrita.
 */
async function coordenacaoSobATrava(convites: ConviteRepository): Promise<{ estado: EstadoDaCoordenacao; ultimoConviteId: string | undefined }> {
  await convites.travarEscola()
  const dados = await convites.dadosDaCoordenacao()
  if (dados === undefined) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
  return { estado: estadoDaCoordenacao(dados), ultimoConviteId: dados.ultimoConvite?.id }
}

/**
 * O convite da primeira coordenação, pelo operador: pelo painel (`POST /v1/operacao/escolas/:id/convite-coordenacao`) e
 * pelo `ops:convite-coordenador`, o mesmo caso de uso (RF2; Tech Spec da A0b, seção 5). Numa transação:
 * - o autor é conferido como primeira instrução (`ConferenciaDoAutor`), antes de ler a escola do endereço;
 * - no contexto da escola, pega a trava dela e lê o estado da coordenação; a matriz decide:
 *   - `sem_convite`, `revogado`: cria;
 *   - `aceito`, `sem_coordenacao`: revoga o último convite, com `convite.revogado` dele na auditoria (no `aceito`, o aceite
 *     anterior deixa de ativar; no `sem_coordenacao`, o convite já usado é revogado só como registro), e cria;
 *   - `pendente`, `vencido`, `ativa`: `CONFLITO`, sem gravar nada. Com convite em aberto, o caminho é refazer, ou
 *     revogar e gerar;
 * - acha ou cria a conta pelo e-mail (conta nova nasce sem senha) e o coordenador dela, inativo até o aceite; com o mesmo
 *   e-mail, o usuário é reaproveitado, e só o convite novo o ativa;
 * - grava o convite com o SHA-256 do token, válido por 72 h, e `convite.criado` com o operador e se a conta é nova (sem o
 *   e-mail).
 *
 * Escola inexistente: `NAO_ENCONTRADO`, antes de criar conta ou usuário. Devolve o id do convite e o token: o painel o
 * devolve uma vez na resposta, e o comando o grava num arquivo 0600. Nunca o token, o nome ou o e-mail em log.
 */
export async function criarConviteDeCoordenador(banco: Banco, autor: ConferenciaDoAutor, pedido: PedidoDeConvite, relogio: Relogio = relogioDoSistema): Promise<{ conviteId: string; token: string }> {
  const requisicaoId = contextoAtual()?.requisicaoId ?? randomUUID()
  const token = randomBytes(BYTES_DO_TOKEN_DE_CONVITE).toString('base64url')
  const expiraEm = new Date(relogio.agora().getTime() + VALIDADE_DO_CONVITE_HORAS * 60 * 60 * 1_000)
  const conviteId = await executarNoContexto({ requisicaoId }, () =>
    banco.transaction(async (tx) => {
      // O autor primeiro: quem não passa não lê nem grava nada, nem a escola do endereço.
      const autorOperador = await autor(tx)
      const escolaId = 'slug' in pedido ? await new ResolucaoDeTenantRepository(tx).escolaPorSlug(pedido.slug) : pedido.escolaId
      if (escolaId === undefined) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
      return executarNoContexto({ requisicaoId, escolaId }, async () => {
        const convites = new ConviteRepository(tx)
        const { estado, ultimoConviteId } = await coordenacaoSobATrava(convites)
        const acao = GERAR[estado]
        if (acao === 'conflito') throw new ErroDeDominio(CodigoDeErro.CONFLITO)
        if (acao === 'revogar_o_ultimo_e_criar' && ultimoConviteId !== undefined) {
          if (!(await convites.revogar(ultimoConviteId))) throw new ErroDeDominio(CodigoDeErro.CONFLITO)
          await registro.gravar(tx, 'convite.revogado', { entidadeId: ultimoConviteId, autorOperador })
        }
        const conta = await new ResolucaoDeTenantRepository(tx).contaParaConvite(normalizarEmail(pedido.email))
        const usuarioId = await convites.usuarioConvidado(conta.id, pedido.nome)
        // Sem coordenador ativo na escola (o estado não é `ativa`), o da conta também não está: não chega aqui.
        if (usuarioId === undefined) throw new ErroDeDominio(CodigoDeErro.CONFLITO)
        const criado = await convites.criarConvite({ tokenHash: hashDoToken(token), usuarioId, expiraEm })
        await registro.gravar(tx, 'convite.criado', { entidadeId: criado, depois: { usuarioId, expiraEm: expiraEm.toISOString(), contaNova: conta.nova }, autorOperador })
        return criado
      })
    }),
  )
  return { conviteId, token }
}

/**
 * A revogação do convite da coordenação pelo operador: pelo painel (`POST /v1/operacao/convites/:id/revogar`) e pelo
 * `ops:revogar-convite`, o mesmo caso de uso (RF2, RF19; Tech Spec da A0b, seção 5). A escola vem do convite, nunca do
 * argumento, e só convite `tipo = 'coordenador'` é achado. Numa transação, com o autor conferido como primeira
 * instrução, no contexto da escola, com a trava dela, e só então o estado:
 * - convite inexistente, de outro tipo, ou já revogado, e escola em `revogado`: `NAO_ENCONTRADO`, como no F1;
 * - convite que não é o último da escola: `CONFLITO` (o convite mudou);
 * - `pendente`, `vencido`, `aceito`: revoga, com `convite.revogado`. No `aceito`, o aceite deixa de ativar no login;
 * - `sem_coordenacao`, `ativa`: `CONFLITO`, sem gravar nada.
 *
 * Devolve a escola do convite, para o log de quem chamou.
 */
export async function revogarConvitePeloOperador(banco: Banco, autor: ConferenciaDoAutor, conviteId: string): Promise<{ escolaId: string }> {
  const requisicaoId = contextoAtual()?.requisicaoId ?? randomUUID()
  return executarNoContexto({ requisicaoId }, () =>
    banco.transaction(async (tx) => {
      const autorOperador = await autor(tx)
      const escolaId = await new ResolucaoDeTenantRepository(tx).escolaDoConviteParaOperador(conviteId)
      if (escolaId === undefined) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
      await executarNoContexto({ requisicaoId, escolaId }, async () => {
        const convites = new ConviteRepository(tx)
        const { estado, ultimoConviteId } = await coordenacaoSobATrava(convites)
        const acao = REVOGAR[estado]
        if (acao === 'nao_encontrado') throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
        // Já revogado (por um gerar ou revogar que veio antes na trava): como no F1.
        const jaRevogado = await convites.revogado(conviteId)
        if (jaRevogado === undefined || jaRevogado) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
        if (acao === 'conflito') throw new ErroDeDominio(CodigoDeErro.CONFLITO)
        // Um convite em aberto que não é o último: o convite mudou.
        if (conviteId !== ultimoConviteId) throw new ErroDeDominio(CodigoDeErro.CONFLITO)
        if (!(await convites.revogar(conviteId))) throw new ErroDeDominio(CodigoDeErro.NAO_ENCONTRADO)
        await registro.gravar(tx, 'convite.revogado', { entidadeId: conviteId, autorOperador })
      })
      return { escolaId }
    }),
  )
}
