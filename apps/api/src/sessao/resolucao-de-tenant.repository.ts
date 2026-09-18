import { codigoRecuperacao, conta, escola, registroAcesso, SemEscopo, sessao, usuario, type Banco, type EstadoDaSessao, type TransacaoBanco } from '@educa/nucleo'
import type { PapelDeUsuario } from '@educa/shared'
import { and, eq, isNotNull, isNull, lt, or, sql } from 'drizzle-orm'

/**
 * A sessão achada pelo hash do cookie, travada para a renovação decidir (tarefa 5.0): só ids, estado, datas, o papel
 * e a inatividade da escola, sem nada da pessoa. `pelo` diz se o cookie é o atual ou o anterior.
 */
export interface SessaoParaRenovar extends EstadoDaSessao {
  readonly id: string
  readonly escolaId: string
  readonly usuarioId: string
  readonly familia: string
  readonly pelo: 'atual' | 'anterior'
  readonly atualApresentado: boolean
  readonly rotacionadoEm: Date | null
}

/** A credencial achada pelo e-mail: o id, o hash (nulo enquanto a conta não tem senha) e se o MFA está ativo. Nunca o e-mail. */
export interface CredencialDaConta {
  readonly id: string
  readonly senhaHash: string | null
  readonly mfaAtivo: boolean
}

/**
 * O segundo fator de uma conta, achado pelo `conta_id` do desafio ou da sessão verificados: o segredo cifrado e a
 * versão da chave, se está ativo, e o último passo aceito. O e-mail vem só para o cookie `educa_dispositivo` e o
 * sufixo do contador, que usam o HMAC dele: nunca sai em resposta nem em log.
 */
export interface MfaDaConta {
  readonly id: string
  readonly email: string
  readonly segredoCifrado: Buffer | null
  readonly chaveVersao: number | null
  readonly ativadoEm: Date | null
  readonly ultimoPasso: number | null
}

/** Um usuário ativo de uma conta: só o id, a escola e o papel, nunca o nome. */
export interface UsuarioAtivoDaConta {
  readonly usuarioId: string
  readonly escolaId: string
  readonly papel: PapelDeUsuario
}

/**
 * A fronteira da resolução de tenant, e a única do sistema (Tech Spec, seção 6): toda operação que acontece antes de
 * existir escola no contexto, ou que toca a `conta` global, que não tem escola. Cada método leva `@SemEscopo` com a
 * justificativa da tabela da seção 6, e devolve o mínimo para quem chama chegar à escola certa.
 *
 * O desvio da regra 10, item 9 (mais de três exceções) fica contido por teste: só os arquivos de
 * `apps/api/src/sessao` importam esta classe (`apps/api/test/arquitetura.test.ts`). As tarefas seguintes
 * acrescentam os outros métodos da mesma tabela.
 */
export class ResolucaoDeTenantRepository {
  constructor(private readonly banco: Banco | TransacaoBanco) {}

  /**
   * Com o `banco` sendo a transação da renovação: acha a sessão cujo hash atual ou anterior é o do cookie e a trava
   * (`FOR UPDATE OF sessao`, sem travar o usuário nem a escola). Duas renovações do mesmo cookie esperam uma pela
   * outra, e a segunda relê a linha já rotacionada: o hash que era atual passa a ser o anterior.
   */
  @SemEscopo('o cookie de renovação não diz a escola: a sessão é achada pelo hash atual ou anterior do refresh, e só depois a escola dela vira contexto')
  async sessaoParaRenovar(refreshHash: string): Promise<SessaoParaRenovar | undefined> {
    const [linha] = await this.banco
      .select({
        id: sessao.id,
        escolaId: sessao.escolaId,
        usuarioId: sessao.usuarioId,
        familia: sessao.familia,
        refreshHash: sessao.refreshHash,
        atualApresentado: sessao.atualApresentado,
        rotacionadoEm: sessao.rotacionadoEm,
        encerradaEm: sessao.encerradaEm,
        expiraEm: sessao.expiraEm,
        ultimoUsoEm: sessao.ultimoUsoEm,
        papel: usuario.papel,
        desativadoEm: usuario.desativadoEm,
        inatividadeAlunoMin: escola.inatividadeAlunoMin,
        inatividadeEquipeMin: escola.inatividadeEquipeMin,
        agora: sql<Date>`now()`.mapWith(sessao.expiraEm),
      })
      .from(sessao)
      .innerJoin(usuario, and(eq(usuario.escolaId, sessao.escolaId), eq(usuario.id, sessao.usuarioId)))
      .innerJoin(escola, eq(escola.id, sessao.escolaId))
      .where(or(eq(sessao.refreshHash, refreshHash), eq(sessao.refreshHashAnterior, refreshHash)))
      .limit(1)
      .for('update', { of: sessao })
    if (linha === undefined) return undefined
    const { refreshHash: atual, ...resto } = linha
    return { ...resto, pelo: atual === refreshHash ? 'atual' : 'anterior' }
  }

  @SemEscopo('a credencial da equipe é global: depois da senha verificada, lista em que escolas a conta tem usuário ativo, só com id, escola e papel')
  usuariosAtivosDaConta(contaId: string): Promise<UsuarioAtivoDaConta[]> {
    return this.banco
      .select({ usuarioId: usuario.id, escolaId: usuario.escolaId, papel: usuario.papel })
      .from(usuario)
      .where(and(eq(usuario.contaId, contaId), isNull(usuario.desativadoEm)))
      .orderBy(usuario.escolaId, usuario.id)
  }

  @SemEscopo('a credencial da equipe é global: o login por e-mail acha a conta pelo e-mail antes de haver escola, e devolve só o id, o hash e se o MFA está ativo')
  async contaPorEmail(email: string): Promise<CredencialDaConta | undefined> {
    const [linha] = await this.banco
      .select({ id: conta.id, senhaHash: conta.senhaHash, mfaAtivadoEm: conta.mfaAtivadoEm })
      .from(conta)
      .where(eq(conta.email, email))
      .limit(1)
    return linha === undefined ? undefined : { id: linha.id, senhaHash: linha.senhaHash, mfaAtivo: linha.mfaAtivadoEm !== null }
  }

  @SemEscopo('a falha de login por e-mail acontece antes de haver escola: grava o registro de acesso com escola e usuário nulos, só com o evento e o IP')
  async gravarFalhaDeLoginPorEmail(ip: string): Promise<void> {
    await this.banco.insert(registroAcesso).values({ escolaId: null, usuarioId: null, evento: 'login_falho', ip })
  }

  @SemEscopo('a conta é global e não tem escola: criar a credencial da equipe grava só o e-mail e devolve só os ids, sem ler conta existente')
  async criarContas(emails: readonly string[]): Promise<string[]> {
    if (emails.length === 0) return []
    const criadas = await this.banco
      .insert(conta)
      .values(emails.map((email) => ({ email })))
      .returning({ id: conta.id })
    return criadas.map((criada) => criada.id)
  }
  @SemEscopo('a credencial da equipe é global: verificar o TOTP e a recuperação lê a conta pelo conta_id do desafio ou da sessão verificados, nunca pelo do cliente')
  async mfaDaConta(contaId: string): Promise<MfaDaConta | undefined> {
    const [linha] = await this.banco
      .select({
        id: conta.id,
        email: conta.email,
        segredoCifrado: conta.mfaSegredoCifrado,
        chaveVersao: conta.mfaChaveVersao,
        ativadoEm: conta.mfaAtivadoEm,
        ultimoPasso: conta.mfaUltimoPasso,
      })
      .from(conta)
      .where(eq(conta.id, contaId))
      .limit(1)
    return linha
  }

  /**
   * Grava o segredo novo só enquanto o MFA está inativo (`mfa_ativado_em is null`): quem tem só a senha de uma conta
   * com MFA não troca o segundo fator. Devolve se gravou.
   */
  @SemEscopo('a credencial da equipe é global: configurar o MFA escreve na conta pelo conta_id do desafio verificado, e só com o MFA inativo')
  async gravarSegredoDeMfa(contaId: string, cifrado: Buffer, versao: number): Promise<boolean> {
    const gravadas = await this.banco
      .update(conta)
      .set({ mfaSegredoCifrado: cifrado, mfaChaveVersao: versao, mfaUltimoPasso: null })
      .where(and(eq(conta.id, contaId), isNull(conta.mfaAtivadoEm)))
      .returning({ id: conta.id })
    return gravadas.length === 1
  }

  /**
   * Com o `banco` sendo a transação da ativação: liga o MFA com o passo do código que a provou, só se ainda estava
   * inativo e com o mesmo segredo que foi conferido (duas ativações juntas passam uma vez), troca os códigos de
   * recuperação da conta pelos novos (só HMAC) e devolve se ativou.
   */
  @SemEscopo('a credencial da equipe é global: ativar o MFA escreve na conta e nos códigos de recuperação dela, pelo conta_id do desafio verificado')
  async ativarMfa(contaId: string, segredoConferido: Buffer, passo: number, hmacs: readonly string[]): Promise<boolean> {
    const ativadas = await this.banco
      .update(conta)
      .set({ mfaAtivadoEm: sql`now()`, mfaUltimoPasso: passo })
      .where(and(eq(conta.id, contaId), isNull(conta.mfaAtivadoEm), eq(conta.mfaSegredoCifrado, segredoConferido)))
      .returning({ id: conta.id })
    if (ativadas.length !== 1) return false
    await this.banco.delete(codigoRecuperacao).where(eq(codigoRecuperacao.contaId, contaId))
    await this.banco.insert(codigoRecuperacao).values(hmacs.map((hmac) => ({ contaId, hmac })))
    return true
  }

  /**
   * Aceita o passo do TOTP só se ele é maior que o último aceito (`update … where mfa_ultimo_passo < $passo`): o mesmo
   * código em dois pedidos ao mesmo tempo passa uma vez, e um código já usado não volta (regra 80, item 7).
   */
  @SemEscopo('a credencial da equipe é global: aceitar o código do app autenticador grava mfa_ultimo_passo na conta do desafio verificado')
  async avancarPassoDoMfa(contaId: string, passo: number): Promise<boolean> {
    const aceitas = await this.banco
      .update(conta)
      .set({ mfaUltimoPasso: passo })
      .where(and(eq(conta.id, contaId), isNotNull(conta.mfaAtivadoEm), or(isNull(conta.mfaUltimoPasso), lt(conta.mfaUltimoPasso, passo))))
      .returning({ id: conta.id })
    return aceitas.length === 1
  }

  /**
   * Marca o código de recuperação como usado, uma vez só (`where usado_em is null`), e devolve se ele valia. Os códigos
   * só existem com o MFA ativo: nascem na ativação e saem na redefinição, na mesma transação de cada uma.
   */
  @SemEscopo('a credencial da equipe é global: consumir o código de recuperação escreve nos códigos da conta do desafio verificado')
  async usarCodigoDeRecuperacao(contaId: string, hmac: string): Promise<boolean> {
    const usados = await this.banco
      .update(codigoRecuperacao)
      .set({ usadoEm: sql`now()` })
      .where(and(eq(codigoRecuperacao.contaId, contaId), eq(codigoRecuperacao.hmac, hmac), isNull(codigoRecuperacao.usadoEm)))
      .returning({ id: codigoRecuperacao.id })
    return usados.length === 1
  }

  /**
   * Com o `banco` sendo a transação da redefinição: trava a conta (`FOR UPDATE`) e devolve se o MFA dela está ativo e
   * as escolas dos usuários ativos dela, só os ids. `FOR UPDATE`, e não `FOR NO KEY UPDATE`, de propósito: conflita
   * com o `FOR KEY SHARE` da FK de `usuario`, então um usuário novo dessa conta em outra escola (convite, 7.0) ou já
   * foi gravado antes e aparece aqui, ou espera o commit. Duas redefinições da mesma conta esperam uma pela outra.
   */
  @SemEscopo('a credencial da equipe é global: redefinir o MFA confere, com a conta travada, em que escolas ela tem usuário ativo, só pelos ids')
  async travarContaParaRedefinir(contaId: string): Promise<{ mfaAtivo: boolean; escolasAtivas: string[] } | undefined> {
    const [linha] = await this.banco.select({ ativadoEm: conta.mfaAtivadoEm }).from(conta).where(eq(conta.id, contaId)).for('update')
    if (linha === undefined) return undefined
    const ativos = await this.banco
      .selectDistinct({ escolaId: usuario.escolaId })
      .from(usuario)
      .where(and(eq(usuario.contaId, contaId), isNull(usuario.desativadoEm)))
      .orderBy(usuario.escolaId)
    return { mfaAtivo: linha.ativadoEm !== null, escolasAtivas: ativos.map((ativo) => ativo.escolaId) }
  }

  /** Apaga o segundo fator da conta: segredo, versão, ativação, último passo e todos os códigos de recuperação. */
  @SemEscopo('a credencial da equipe é global: a redefinição do MFA apaga o segundo fator da conta, depois de conferida a escola de todos os usuários ativos dela')
  async apagarMfa(contaId: string): Promise<void> {
    await this.banco.update(conta).set({ mfaSegredoCifrado: null, mfaChaveVersao: null, mfaAtivadoEm: null, mfaUltimoPasso: null }).where(eq(conta.id, contaId))
    await this.banco.delete(codigoRecuperacao).where(eq(codigoRecuperacao.contaId, contaId))
  }

  /**
   * A escola de um usuário, para o `ops:redefinir-mfa` abrir o contexto dela: o operador recebe só o id do usuário,
   * e a escola vem daqui, nunca do argumento. Devolve só a escola e a conta, nunca o nome.
   */
  @SemEscopo('rotina do operador (ops:redefinir-mfa): o comando recebe só o usuarioId do pedido formal, e a escola dele vira o contexto')
  async escolaDoUsuarioParaOperador(usuarioId: string): Promise<{ escolaId: string; contaId: string | null; ativo: boolean } | undefined> {
    const [linha] = await this.banco
      .select({ escolaId: usuario.escolaId, contaId: usuario.contaId, desativadoEm: usuario.desativadoEm })
      .from(usuario)
      .where(eq(usuario.id, usuarioId))
      .limit(1)
    return linha === undefined ? undefined : { escolaId: linha.escolaId, contaId: linha.contaId, ativo: linha.desativadoEm === null }
  }
}
